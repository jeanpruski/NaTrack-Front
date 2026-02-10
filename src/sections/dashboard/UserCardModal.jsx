import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserHoloCard } from "../../components/UserHoloCard";

export function UserCardModal({ open, onClose, user, nfDecimal, userRankInfo, userRunningAvgKm }) {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-[30px] sm:px-4"
          onTouchMove={(e) => e.preventDefault()}
        >
          <motion.div
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-[360px] mx-auto"
            initial={{ opacity: 0, scale: 0.9, rotateX: 18, y: -12 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateX: -6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <UserHoloCard
              user={user}
              nfDecimal={nfDecimal}
              userRankInfo={userRankInfo}
              elevated
              showBotAverage
              userRunningAvgKm={userRunningAvgKm}
              minSpinnerMs={500}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
