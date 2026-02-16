import { useEffect, useState } from "react";
import { apiGet } from "../utils/api";
import { normalizeSession } from "../utils/appUtils";

export function useAppData({ authToken, isAuth, setError }) {
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [activeSeasonInfo, setActiveSeasonInfo] = useState(null);
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [sessionLikes, setSessionLikes] = useState(new Set());
  const [cardResults, setCardResults] = useState([]);
  const [userCardResults, setUserCardResults] = useState([]);

  const refreshSessions = async ({ shouldUpdate } = {}) => {
    try {
      const data = await apiGet("/sessions");
      const normalized = (data || []).map((s) => normalizeSession(s));
      if (shouldUpdate && !shouldUpdate()) return;
      setSessions(normalized);
      if (setError) setError("");
    } catch (e) {
      if (shouldUpdate && !shouldUpdate()) return;
      if (setError) setError("Chargement impossible : " + (e?.message || "erreur inconnue"));
    }
  };

  const refreshUsers = async () => {
    try {
      const data = await apiGet("/users/public");
      setUsers(data || []);
    } catch {
      setUsers([]);
    }
  };

  const refreshNews = async () => {
    setNewsLoading(true);
    setNewsError("");
    try {
      const data = await apiGet("/news");
      setNewsItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setNewsItems([]);
      setNewsError(e?.message || "Erreur news");
    } finally {
      setNewsLoading(false);
    }
  };

  const refreshNotifications = async () => {
    if (!isAuth || !authToken) {
      setNotifications([]);
      setNotificationsError("");
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const data = await apiGet("/me/notifications?limit=50", authToken);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setNotifications([]);
      setNotificationsError(e?.message || "Erreur notifications");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const refreshSessionLikes = async () => {
    if (!isAuth || !authToken) {
      setSessionLikes(new Set());
      return;
    }
    try {
      const data = await apiGet("/me/session-likes", authToken);
      const ids = Array.isArray(data) ? data : data?.session_ids || [];
      setSessionLikes(new Set(ids.map((id) => String(id))));
    } catch {
      setSessionLikes(new Set());
    }
  };

  const refreshCardResults = async () => {
    if (!isAuth || !authToken) {
      setCardResults([]);
      return;
    }
    try {
      const data = await apiGet("/me/card-results", authToken);
      setCardResults(Array.isArray(data) ? data : []);
    } catch {
      setCardResults([]);
    }
  };

  const refreshUserCardResults = async () => {
    if (!isAuth || !authToken) {
      setUserCardResults([]);
      return;
    }
    try {
      const data = await apiGet("/me/user-card-results", authToken);
      setUserCardResults(Array.isArray(data) ? data : []);
    } catch {
      setUserCardResults([]);
    }
  };

  const refreshChallenge = async () => {
    if (!isAuth || !authToken) {
      setActiveChallenge(null);
      return;
    }
    try {
      const data = await apiGet("/me/challenge", authToken);
      setActiveChallenge(data?.challenge || null);
    } catch {
      setActiveChallenge(null);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiGet("/users/public");
        if (alive) setUsers(data || []);
      } catch {
        if (!alive) return;
        setUsers([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiGet("/seasons");
        if (!alive) return;
        setSeasons(Array.isArray(data) ? data : []);
      } catch {
        if (!alive) return;
        setSeasons([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiGet("/season/active");
        if (!alive) return;
        if (data && data.season_number !== null && data.season_number !== undefined) {
          setActiveSeasonInfo(data);
        } else {
          setActiveSeasonInfo(null);
        }
      } catch {
        if (!alive) return;
        setActiveSeasonInfo(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setNewsLoading(true);
    setNewsError("");
    (async () => {
      try {
        const data = await apiGet("/news");
        if (!alive) return;
        setNewsItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setNewsItems([]);
        setNewsError(e?.message || "Erreur news");
      } finally {
        if (alive) setNewsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return {
    sessions,
    setSessions,
    users,
    seasons,
    activeSeasonInfo,
    newsItems,
    newsLoading,
    newsError,
    notifications,
    notificationsLoading,
    notificationsError,
    activeChallenge,
    sessionLikes,
    cardResults,
    userCardResults,
    refreshSessions,
    refreshUsers,
    refreshNews,
    refreshNotifications,
    refreshSessionLikes,
    refreshCardResults,
    refreshUserCardResults,
    refreshChallenge,
    setNotifications,
    setNotificationsError,
    setSessionLikes,
    setActiveChallenge,
    setUserCardResults,
  };
}
