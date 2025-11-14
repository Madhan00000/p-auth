// pages/index2.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Index2() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [tokenStatus, setTokenStatus] = useState("inactive");
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  // Fetch user status from backend
  const fetchUserStatus = async (email) => {
    try {
      const res = await fetch(`/.netlify/functions/getUserStatus?email=${email}`);
      const data = await res.json();
      if (res.ok) {
        setTokenStatus(data.tokenStatus);
        setTokenExpiry(data.tokenExpiry);
      }
    } catch (err) {
      console.error("Fetch user status error:", err);
    }
  };

  useEffect(() => {
    if (router.query.email) {
      const mail = router.query.email;
      const ref = router.query.referralCode;
      setEmail(mail);
      setReferralCode(ref);
      fetchUserStatus(mail);
    }
  }, [router.query]);

  // ⏱ Countdown Timer
  useEffect(() => {
    if (!tokenExpiry) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(tokenExpiry);
      const diff = expiry - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
        setTokenStatus("inactive");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenExpiry]);

  // Go to verification success (Netlify link)
  const handleVerifyClick = () => {
    if (!email) {
      alert("Email not found. Please log in again.");
      return;
    }

    window.location.href = `https://sfl.gl/st/?api=fd2976f682b31724c27b902497a27eb85d5c8565&url=https://0-0-0-2.netlify.app/verificationsuccess.html?email=${encodeURIComponent(
      email
    )}`;
  };

  // When token is active, go to index3
  const handleAccessClick = () => {
    router.push(`/index3?email=${encodeURIComponent(email)}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>🎉 Welcome!</h1>
        <p>You’ve successfully logged in.</p>

        {email && (
          <div style={{ marginTop: 20 }}>
            <p>
              <strong>Email:</strong> {email}
            </p>
            <p>
              <strong>Your Referral Code:</strong>{" "}
              <span style={{ color: "#0070f3", fontWeight: "bold" }}>
                {referralCode}
              </span>
            </p>

            {/* ⏱ Token Status */}
            <p style={{ marginTop: 15 }}>
              <strong>Token Status:</strong>{" "}
              <span
                style={{
                  color: tokenStatus === "active" ? "green" : "red",
                  fontWeight: "bold",
                }}
              >
                {tokenStatus}
              </span>
            </p>

            {tokenStatus === "active" && tokenExpiry && (
              <p>
                ⏳ Time Left:{" "}
                <span style={{ color: "#0070f3", fontWeight: "bold" }}>
                  {timeLeft}
                </span>
              </p>
            )}

            {/* ✅ Buttons */}
            {tokenStatus !== "active" ? (
              <button style={styles.button} onClick={handleVerifyClick}>
                Go to Verification Page
              </button>
            ) : (
              <button style={styles.button} onClick={handleAccessClick}>
                Access Dashboard (Index3)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center",
    background: "#e3f2fd",
  },
  card: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
  },
};
