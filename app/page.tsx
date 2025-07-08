'use client';
import { useState } from 'react';
import ProfileCard from './ProfileCard';
import ConnectButton from './components/ConnectButton';
import MintCard from './components/MintCard';

export default function Home() {
  const [profileData, setProfileData] = useState({
    name: "Berzan",
    title: "Co-founder & CEO monda exchange",
    handle: "berzanorg",
    avatarUrl: "https://cdn.discordapp.com/attachments/1347255078981074997/1392053798880673802/aV_RRUqA_400x400-removebg-preview.png?ex=686e22a0&is=686cd120&hm=b419b1f86a3c06e887906fcb2a97fe250892b0ff9ac035ad31ebc02082816962&"
  });
  const [nftMintCount, setNftMintCount] = useState(0);

  const handleProfileUpdate = (newData: Partial<typeof profileData>) => {
    setProfileData(prev => ({ ...prev, ...newData }));
    setNftMintCount(prev => prev + 1);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      gap: '20px',
      position: 'relative'
    }}>
      <ConnectButton />
      {nftMintCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '20px',
          background: 'rgba(0, 255, 136, 0.1)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#00ff88',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          🎨 Profile NFTs Minted: {nftMintCount}
        </div>
      )}
      <ProfileCard
        name={profileData.name}
        title={profileData.title}
        handle={profileData.handle}
        status="Online"
        contactText=''
        avatarUrl={profileData.avatarUrl}
        showUserInfo={true}
        enableTilt={true}
        onContactClick={() => window.open(`https://x.com/${profileData.handle}`, '_blank')}
        onProfileUpdate={handleProfileUpdate}
      />
      <MintCard />
    </div>
  );
}
