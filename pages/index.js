import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  // Modes: login | register
  const [mode, setMode] = useState("login");

  // Registration steps: 1 = init, 2 = scan + verify
  const [regStep, setRegStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [qr, setQr] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [totp, setTotp] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function callFn(fn, body) {
    const res = await fetch(`/.netlify/functions/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data;
  }

  // ---------------------------
  //  REGISTER STEP 1 (INIT)
  // ---------------------------
  const handleRegisterInit = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("Email and password required");
      return;
    }

    setLoading(true);
    try {
      const data = await callFn("register", {
        action: "init",
        email,
        password,
        referralCode,      // ⬅️ Include referral
      });

      setQr(data.qr);
      setManualKey(data.manualKey);
      setRegStep(2);
      setMessage("Scan QR with an authenticator app & enter TOTP.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  //  REGISTER STEP 2 (VERIFY)
  // ---------------------------
  const handleRegisterVerify = async () => {
    setMessage("");

    if (!totp) {
      setMessage("Enter authenticator code");
      return;
    }

    setLoading(true);
    try {
      const data = await callFn("register", {
        action: "verify",
        email,
        token: totp,
      });

      setMessage("Registration successful! You can now log in.");

      // Reset everything & go back to login
      setMode("login");
      setRegStep(1);
      setQr("");
      setManualKey("");
      setTotp("");
      setPassword("");
      setReferralCode("");

    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  //  LOGIN
  // ---------------------------
  const handleLogin = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("Email and password required");
      return;
    }

    setLoading(true);
    try {
      const data = await callFn("login", { email, password });

      router.push(
        `/index2?email=${encodeURIComponent(data.email)}&referralCode=${encodeURIComponent(
          data.referralCode
        )}`
      );
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>{mode === "login" ? "Login" : "Register"}</h1>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {/* Referral input only in step 1 */}
        {mode === "register" && regStep === 1 && (
          <input
            type="text"
            placeholder="Referral Code (optional)"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            style={styles.input}
          />
        )}

        {/* ---------------- REGISTER STEP 1 BUTTON ---------------- */}
        {mode === "register" && regStep === 1 && (
          <button style={styles.button} onClick={handleRegisterInit} disabled={loading}>
            {loading ? "Please wait..." : "Generate QR"}
          </button>
        )}

        {/* ---------------- REGISTER STEP 2 (TOTP VERIFY) ---------------- */}
        {mode === "register" && regStep === 2 && (
          <>
            <p>Scan QR code in your authenticator app:</p>

            {qr && <img src={qr} alt="QR" style={{ width: 200, marginBottom: 10 }} />}

            {manualKey && (
              <p style={{ fontSize: 12, wordBreak: "break-all" }}>
                Manual key: <b>{manualKey}</b>
              </p>
            )}

            <input
              type="text"
              placeholder="Enter 6-digit TOTP"
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              style={styles.input}
            />

            <button style={styles.button} onClick={handleRegisterVerify} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Register"}
            </button>
          </>
        )}

        {/* ---------------- LOGIN BUTTON ---------------- */}
        {mode === "login" && (
          <button style={styles.button} onClick={handleLogin} disabled={loading}>
            {loading ? "Please wait..." : "Login"}
          </button>
        )}

        {/* Toggle login/register */}
        <p style={{ marginTop: 10 }}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            style={styles.linkButton}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setRegStep(1);
              setMessage("");
              setQr("");
              setManualKey("");
              setTotp("");
            }}
          >
            {mode === "login" ? "Register here" : "Login here"}
          </button>
        </p>

        {message && <p style={styles.message}>{message}</p>}
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
    background: "#f0f4f8",
  },
  card: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "350px",
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginBottom: "10px",
    width: "100%",
  },
  button: {
    width: "100%",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "10px",
  },
  linkButton: {
    background: "none",
    color: "#0070f3",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
  },
  message: {
    marginTop: 10,
    color: "#333",
  },
};
