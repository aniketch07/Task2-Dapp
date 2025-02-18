import { getBalance, getSymbol, transfer, getGasFee } from "@/blockchain/scripts/abc";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import React, { useEffect, useState, useCallback } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";

const Dashboard = () => {
  const [balance, setBalance] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [symbol, setSymbol] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [gasFee, setGasFeeState] = useState("");
  const router = useRouter();
  const [transactionHash, setTransactionHash] = useState("");
  const { address, isConnected } = useAccount();
  const { data } = useWaitForTransactionReceipt({ hash: transactionHash as any });

  useEffect(() => {
    if (!isConnected) {
      setStatus("");
      setTransactionHash("");
      setRecipient("");
      setAmount("");
      setGasFeeState("");
    }
  }, [isConnected]);
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return;
      try {
        const res = await getBalance(address);
        const symbol = await getSymbol();
        const balanceInEther = ethers.utils.formatUnits(res, 18);
        setSymbol(symbol);
        setBalance(balanceInEther);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };
    fetchBalance();
  }, [address, status]);

  useEffect(() => {
    if (data) {
      console.log(data, 'entry');
      setStatus("✅ Transfer successful!");
      setRecipient("");
      setAmount("");
      setTransactionHash("");
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    const fetchGasFee = async () => {
      if (ethers.utils.isAddress(recipient) && parseFloat(amount) > 0) {
        try {
          const fee = await getGasFee(recipient, amount);
          setGasFeeState(fee || "");
        } catch (error) {
          console.error("Error fetching gas fee:", error);
          setGasFeeState("");
        }
      } else {
        setGasFeeState("");
      }
    };

    fetchGasFee();
  }, [recipient, amount]);

  const handleTransfer = useCallback(async () => {
    if (!address || isLoading) return;

    if (!ethers.utils.isAddress(recipient.trim())) {
      setStatus("Invalid recipient address.");
      return;
    }
    if (parseFloat(amount) > parseFloat(balance)) {
      setStatus("Insufficient balance.");
      return;
    }
    if (parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)) {
      setStatus("Invalid transfer amount.");
      return;
    }

    setIsLoading(true);
    setStatus("");

    try {
      const parsedAmount = ethers.utils.parseUnits(amount, 18);
      const res = await transfer(recipient, parsedAmount);
      if (res.hash) {
        setTransactionHash(res.hash);
      }
      console.log(res.hash, 'value res');
    } catch (error) {
      console.error("❌ Transfer failed:", error);
      setStatus("🚨 Transfer failed. Please try again.");
      setIsLoading(false);
    }
  }, [address, recipient, amount, balance, isLoading]);

  return (
    <div
      style={{
        marginTop:"6rem",
        margin: "2rem auto",
        padding: "2rem",
        maxWidth: "600px",
        backgroundColor: "#1E1E1E",
        borderRadius: "16px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
        textAlign: "center",
        color: "#E0E0E0",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#FFFFFF", marginBottom: "1rem" }}>
        Custom Token Dashboard
      </h1>

      {isConnected ? (
        <>
          <div
            style={{
              backgroundColor: "#242424",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
              marginBottom: "1.5rem",
              transition: "transform 0.3s ease",
            }}
          >
            <div style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              Available Balance:
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#03DAC6" }}>
              {balance !== "" ? balance : 'Loading Balance..'} {symbol}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => { setRecipient(e.target.value); setStatus(""); }}
              style={{
                padding: "0.75rem",
                borderRadius: "10px",
                border: "1px solid #444",
                backgroundColor: "#2C2C2C",
                color: "#FFF",
                outline: "none",
                transition: "border 0.3s ease",
              }}
            />
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setStatus(""); }}
              style={{
                padding: "0.75rem",
                borderRadius: "10px",
                border: "1px solid #444",
                backgroundColor: "#2C2C2C",
                color: "#FFF",
                outline: "none",
                transition: "border 0.3s ease",
              }}
            />

{gasFee && (
  <div style={{ color: "#36454F", fontSize: "0.8rem", marginTop: "0.5rem", textAlign: "left" }}>
    Estimated Fee: {gasFee} ETH
  </div>
)}


            <button
              onClick={handleTransfer}
              disabled={isLoading || (balance === "0.0")}
              style={{
                padding: "0.75rem",
                backgroundColor: isLoading || (balance === "0.0") ? "#555" : "#BB86FC",
                color: "#FFF",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: isLoading || (balance === "0.0") ? "not-allowed" : "pointer",
                transition: "background 0.3s ease, transform 0.2s ease",
                transform: isLoading || (balance === "0.0") ? "scale(0.98)" : "scale(1)",
              }}
            >
              {isLoading ? "Sending..." : "Send Tokens"}
            </button>
          </div>
        </>
      ) : (
        <div style={{ marginTop:"3rem",marginBottom:"3rem",color: "#CF6679" }}>Please connect your wallet to view your dashboard.</div>
      )}

      {status && (
        <div
          style={{
            marginTop: "1rem",
            backgroundColor: "#333",
            padding: "0.75rem",
            borderRadius: "8px",
            color: "#FF6B6B",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
