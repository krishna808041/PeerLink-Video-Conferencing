import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";
import { Snackbar } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import img1 from "../assets/bg1.jpg";
import img2 from "../assets/bg2.jpg";
import img3 from "../assets/bg3.jpg";
import img4 from "../assets/bg4.jpg";
import img5 from "../assets/bg5.jpg";

const images = [img1, img2, img3, img4, img5];

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function Authentication() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState();
  const [message, setMessage] = React.useState();
  const [open, setOpen] = React.useState(false);

  const [formState, setFormState] = React.useState(
    searchParams.get("mode") === "signup" ? 1 : 0,
  );
  const [currentImg, setCurrentImg] = React.useState(0);
  const [fade, setFade] = React.useState(true);
  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  // ✅ ADD THIS EFFECT (line 34, after useContext)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentImg((prev) => (prev + 1) % images.length);
        setFade(true);
      }, 800);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const handleAuth = async () => {
    setError("");

    try {
      if (formState === 0) {
        await handleLogin(username.trim(), password);
        return;
      }

      const result = await handleRegister(
        name.trim(),
        username.trim(),
        password,
      );

      setUsername("");
      setPassword("");
      setName("");
      setMessage(result);
      setOpen(true);
      setFormState(0);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Unable to connect to the server. Make sure the backend is running."
          : err.message) ||
        "Something went wrong. Please try again.";

      setError(errorMessage);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid
        container
        component="main"
        sx={{ height: "100vh" }}
        direction="row-reverse"
      >
        <CssBaseline />
        <Grid
          size={{ sm: 4, md: 7 }}
          sx={{
            height: "100vh",
            display: { xs: "none", sm: "block" },
            backgroundImage: `url(${images[currentImg]})`,
            opacity: fade ? 1 : 0,
            transition: "opacity 0.8s ease-in-out",

            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <Grid
          size={{ xs: 12, sm: 8, md: 5 }}
          component={Paper}
          elevation={6}
          square
        >
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
              <LockOutlinedIcon />
            </Avatar>

            <div>
              <Button
                variant={formState === 0 ? "contained" : ""}
                onClick={() => {
                  setFormState(0);
                }}
              >
                Sign In
              </Button>
              <Button
                variant={formState === 1 ? "contained" : ""}
                onClick={() => {
                  setFormState(1);
                }}
              >
                Sign Up
              </Button>
            </div>

            <Box component="form" noValidate sx={{ mt: 1 }}>
              {formState === 1 ? (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="fullname"
                  label="Full Name"
                  name="username"
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                />
              ) : (
                <></>
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                id="password"
              />

              <p style={{ color: "red" }}>{error}</p>

              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleAuth}
              >
                {formState === 0 ? "Login " : "Register"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar open={open} autoHideDuration={4000} message={message} />
    </ThemeProvider>
  );
}
