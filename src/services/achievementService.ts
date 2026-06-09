import { UserProfile, db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { WORLDS } from '../constants';

export async function checkAndAwardAchievements(user: UserProfile, completedMissionId: string, newLevel?: number): Promise<string[]> {
  const newBadges: string[] = [];
  const allCompleted = [...user.completedMissions, completedMissionId];

  // 1. First Code
  if (!user.badges.includes('first-code') && allCompleted.length >= 1) {
    newBadges.push('first-code');
  }

  // 2. World Mastery
  const worldMissions = WORLDS.reduce((acc: Record<string, string[]>, world) => {
    acc[world.id] = world.missions.map(m => m.id);
    return acc;
  }, {});

  const worldBadgeMap: Record<string, string> = {
    'html-island': 'html-ninja',
    'css-mountains': 'css-master',
    'js-city': 'js-wizard',
    'react-galaxy': 'react-hero'
  };

  for (const [worldId, badgeId] of Object.entries(worldBadgeMap)) {
    if (!user.badges.includes(badgeId)) {
      const missionsInWorld = worldMissions[worldId] || [];
      const isComplete = missionsInWorld.every(mId => allCompleted.includes(mId));
      if (isComplete && missionsInWorld.length > 0) {
        newBadges.push(badgeId);
      }
    }
  }

  // 3. Streak
  if (!user.badges.includes('streak-7') && user.streakCount >= 7) {
    newBadges.push('streak-7');
  }

  // 4. Level-up Badges
  if (newLevel) {
    if (newLevel >= 5 && !user.badges.includes('level-5')) {
      newBadges.push('level-5');
    }
    if (newLevel >= 10 && !user.badges.includes('level-10')) {
      newBadges.push('level-10');
    }
  }

  if (newBadges.length > 0) {
    const userRef = doc(db, 'users', user.userId);
    await updateDoc(userRef, {
      badges: arrayUnion(...newBadges)
    });
  }

  return newBadges;
}
