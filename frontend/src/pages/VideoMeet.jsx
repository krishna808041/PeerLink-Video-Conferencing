import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import server from "../environment";

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const navigate = useNavigate();

  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState(true);
  let [audio, setAudio] = useState(true);

  let [screen, setScreen] = useState(false);

  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  // TODO
  // if(isChrome() === false) {

  // }

  useEffect(() => {
    checkDeviceAvailability();
  }, []);

  // 🔥 ADD THIS RIGHT HERE
  useEffect(() => {
    if (!askForUsername && localVideoref.current && window.localStream) {
      console.log("🔁 Reattaching stream after render");

      localVideoref.current.srcObject = window.localStream;

      localVideoref.current.onloadedmetadata = () => {
        localVideoref.current.play().catch(() => {});
      };
    }
  }, [askForUsername]);

  const checkDeviceAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some((d) => d.kind === "videoinput");
      const hasAudio = devices.some((d) => d.kind === "audioinput");
      setVideoAvailable(hasVideo);
      setAudioAvailable(hasAudio);
      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
    } catch (e) {
      console.log(e);
    }
  };

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setVideoAvailable(true);
      setAudioAvailable(true);

      window.localStream = stream;
      if (localVideoref.current) {
        localVideoref.current.srcObject = stream;
        localVideoref.current.play().catch(() => {});
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }
    } catch (error) {
      // Check specifically what was denied
      console.log("Permission error:", error.name);
      if (error.name === "NotAllowedError") {
        setVideoAvailable(false);
        setAudioAvailable(false);
      }
      if (error.name === "NotFoundError") {
        setVideoAvailable(false);
      }
    }
  };

  let getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream && window.localStream !== stream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
      localVideoref.current.play().catch(() => {});
    }
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      addOrReplaceLocalTracks(connections[id], window.localStream);

      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        console.log("⚠️ Track ended:", track.kind);

        if (track.kind === "video") {
          setVideo(false);
        }
        if (track.kind === "audio") {
          setAudio(false);
        }

        // ✅ Only update peers (DO NOT touch local video)
        for (let id in connections) {
          const sender = connections[id]
            .getSenders()
            .find((s) => s.track && s.track.kind === track.kind);

          if (sender) {
            sender.replaceTrack(null);
          }
        }
      };
    });
  };

  let getDislayMediaSuccess = (stream) => {
    console.log("SCREEN SHARE STARTED");

    const videoTrack = stream.getVideoTracks()[0];

    for (let id in connections) {
      const sender = connections[id]
        .getSenders()
        .find((s) => s.track?.kind === "video");

      if (sender) {
        sender.replaceTrack(videoTrack); // 🔥 KEY FIX
      }
    }

    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
      localVideoref.current.play().catch(() => {});
    }

    videoTrack.onended = () => {
      console.log("SCREEN SHARE STOPPED");

      setScreen(false);

      // Restore camera
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((camStream) => {
          window.localStream = camStream;
          localVideoref.current.srcObject = camStream;

          const camTrack = camStream.getVideoTracks()[0];

          for (let id in connections) {
            const sender = connections[id]
              .getSenders()
              .find((s) => s.track?.kind === "video");

            if (sender) {
              sender.replaceTrack(camTrack);
            }
          }
        });
    };
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (!connections[fromId]) {
      createPeerConnection(fromId);
    }

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  const addOrUpdateRemoteVideo = (socketListId, stream) => {
    setVideos((previousVideos) => {
      const videoExists = previousVideos.some(
        (video) => video.socketId === socketListId,
      );

      const updatedVideos = videoExists
        ? previousVideos.map((video) =>
            video.socketId === socketListId ? { ...video, stream } : video,
          )
        : [
            ...previousVideos,
            {
              socketId: socketListId,
              stream,
            },
          ];

      videoRef.current = updatedVideos;

      return updatedVideos;
    });
  };

  const addOrReplaceLocalTracks = (peerConnection, stream) => {
    if (!peerConnection || !stream) {
      return;
    }

    stream.getTracks().forEach((track) => {
      const existingSender = peerConnection
        .getSenders()
        .find((sender) => sender.track?.kind === track.kind);

      if (existingSender) {
        existingSender.replaceTrack(track).catch((error) => {
          console.log("Track replacement failed:", error);
        });
      } else {
        peerConnection.addTrack(track, stream);
      }
    });
  };

  const createPeerConnection = (socketListId) => {
    // Never connect the current user to themselves
    if (socketListId === socketIdRef.current) {
      return null;
    }

    // Keep the existing connection instead of overwriting it
    if (connections[socketListId]) {
      return connections[socketListId];
    }

    const peerConnection = new RTCPeerConnection(peerConfigConnections);

    connections[socketListId] = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit(
          "signal",
          socketListId,
          JSON.stringify({
            ice: event.candidate,
          }),
        );
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];

      if (remoteStream) {
        addOrUpdateRemoteVideo(socketListId, remoteStream);
      }
    };

    // Add the local camera and microphone only once
    if (window.localStream) {
      addOrReplaceLocalTracks(peerConnection, window.localStream);
    }

    return peerConnection;
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        if (connections[id]) {
          connections[id].close();
          delete connections[id];
        }

        setVideos((previousVideos) =>
          previousVideos.filter((video) => video.socketId !== id),
        );
      });

      socketRef.current.on("user-joined", async (joinedSocketId, clients) => {
        try {
          // Create only connections that do not already exist
          clients.forEach((socketListId) => {
            createPeerConnection(socketListId);
          });

          /*
       Only the newly joined user creates offers.

       Existing participants wait for that offer and send answers.
      */
          if (joinedSocketId !== socketIdRef.current) {
            return;
          }

          for (const otherSocketId of clients) {
            if (otherSocketId === socketIdRef.current) {
              continue;
            }

            const peerConnection = connections[otherSocketId];

            if (!peerConnection) {
              continue;
            }

            const offer = await peerConnection.createOffer();

            await peerConnection.setLocalDescription(offer);

            socketRef.current.emit(
              "signal",
              otherSocketId,
              JSON.stringify({
                sdp: peerConnection.localDescription,
              }),
            );
          }
        } catch (error) {
          console.log("Error while connecting participant:", error);
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => {
    if (!window.localStream) return;

    const videoTrack = window.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const newState = !videoTrack.enabled;
    videoTrack.enabled = newState;

    setVideo(newState);

    console.log("🎥 Camera:", newState ? "ON" : "OFF");
  };
  let handleAudio = () => {
    const newAudioState = !audio;
    setAudio(newAudioState);

    if (window.localStream) {
      const audioTrack = window.localStream
        .getTracks()
        .find((track) => track.kind === "audio");

      if (audioTrack) {
        audioTrack.enabled = newAudioState;
      }
    }
  };
  useEffect(() => {
    if (screen === true) {
      getDislayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      // Stop local camera and microphone
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => {
          track.stop();
        });

        window.localStream = null;
      }

      // Close all WebRTC peer connections
      Object.keys(connections).forEach((id) => {
        connections[id]?.close();
        delete connections[id];
      });

      // Clear remote videos from this user's screen
      setVideos([]);

      // Disconnect Socket.IO
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    } catch (error) {
      console.log("Error while ending call:", error);
    }

    navigate("/home");
  };
  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit("chat-message", message, username);
    setMessage("");

    // this.setState({ message: "", sender: username })
  };

  let connect = async () => {
    console.log("CONNECT CLICKED");

    try {
      console.log("Requesting permission...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("✅ STREAM OBJECT:", stream);
      console.log("🎥 VIDEO TRACKS:", stream.getVideoTracks());
      console.log("🎤 AUDIO TRACKS:", stream.getAudioTracks());

      if (stream.getVideoTracks().length === 0) {
        console.log("❌ NO VIDEO TRACK FOUND");
      }

      window.localStream = stream;

      if (localVideoref.current) {
        console.log("🎬 Attaching stream to video element");

        localVideoref.current.srcObject = stream;

        localVideoref.current.onloadedmetadata = () => {
          console.log("📺 Video metadata loaded");
          localVideoref.current.play();
        };

        // ✅ ADD DEBUG HERE
        setTimeout(() => {
          console.log("📺 Video Element:", localVideoref.current);
          console.log("📺 srcObject:", localVideoref.current.srcObject);
        }, 1000);
      }

      await getUserMediaSuccess(stream);

      setVideo(true);
      setAudio(true);
      setAskForUsername(false);

      connectToSocketServer();
    } catch (err) {
      console.log("❌ ERROR:", err.name, err.message);
    }
  };
  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  const remoteLayoutClass =
    videos.length === 0
      ? ""
      : videos.length <= 6
        ? styles[`participants${videos.length}`]
        : styles.participantsMany;

  return (
    <div>
      {askForUsername === true ? (
        <div className={styles.lobbyPage}>
          <div className={styles.lobbyCard}>
            <h2>Enter into Lobby </h2>
            <TextField
              id="outlined-basic"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
            />
            <Button variant="contained" onClick={connect}>
              Connect
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>

                <div className={styles.chattingDisplay}>
                  {messages.length !== 0 ? (
                    messages.map((item, index) => {
                      console.log(messages);
                      return (
                        <div style={{ marginBottom: "20px" }} key={index}>
                          <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter Your chat"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="orange">
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: "white" }}
              >
                <ChatIcon />{" "}
              </IconButton>
            </Badge>
          </div>

          <div className={`${styles.conferenceView} ${remoteLayoutClass}`}>
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
              </div>
            ))}
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoref}
            autoPlay
            playsInline
            muted
            style={{ opacity: video ? 1 : 0.3 }}
          />
        </div>
      )}
    </div>
  );
}
