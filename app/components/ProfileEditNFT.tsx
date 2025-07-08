
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useSendTransaction, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import './ProfileEditNFT.css';

interface ProfileEditNFTProps {
  profileData: any;
  onMintComplete?: (success: boolean) => void;
  contractAddress?: string;
}

const ProfileEditNFT: React.FC<ProfileEditNFTProps> = ({
  profileData,
  onMintComplete,
  contractAddress = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701"
}) => {
  const recipientAddress = "0x7bf2D50D2EC35ae6100BE9c4dbDadBE211Ae722E";
  const { isConnected, address, chain } = useAccount();
  const [isVisible, setIsVisible] = useState(false);
  const [autoMintEnabled, setAutoMintEnabled] = useState(true);

  // Get user's MON balance
  const { data: balance } = useBalance({
    address: address,
    chainId: 41454, // Monad testnet
  });

  // Check if user has already minted (limit 1 per wallet)
  const { data: userMintCount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ] as const,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { writeContract, data: hash, error } = useWriteContract();
  const { sendTransaction, data: paymentHash, error: paymentError } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  const { isLoading: isPaymentConfirming, isSuccess: isPaymentConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: paymentHash, 
    });

  // ERC721 mint function ABI with metadata (free mint)
  const mintABI = [
    {
      name: 'mintWithMetadata',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'metadata', type: 'string' }
      ],
      outputs: []
    }
  ] as const;

  const mintPrice = parseEther('1'); // 1 MON per NFT
  const hasEnoughBalance = balance && balance.value >= mintPrice;
  const balanceInMon = balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0';
  const hasAlreadyMinted = userMintCount && userMintCount > 0;

  // Generate metadata for the NFT
  const generateMetadata = (profileData: any) => {
    const metadata = {
      name: `Profile Card - ${profileData?.name || 'Unknown'} (Updated)`,
      description: `An updated profile card NFT for ${profileData?.name || 'user'} on Monad`,
      image: profileData?.avatarUrl || '/avatar.png',
      attributes: [
        {
          trait_type: 'Name',
          value: profileData?.name || 'Unknown'
        },
        {
          trait_type: 'Title',
          value: profileData?.title || 'No Title'
        },
        {
          trait_type: 'Handle',
          value: profileData?.handle || 'unknown'
        },
        {
          trait_type: 'Last Updated',
          value: new Date().toISOString()
        },
        {
          trait_type: 'Chain',
          value: 'Monad Testnet'
        },
        {
          trait_type: 'Type',
          value: 'Profile Update'
        }
      ],
      external_url: `https://x.com/${profileData?.handle || 'unknown'}`,
      updated_at: new Date().toISOString(),
      profile_version: profileData?.version || '1.0'
    };
    
    return JSON.stringify(metadata);
  };

  // Auto-mint when profile data changes
  useEffect(() => {
    if (profileData && autoMintEnabled && isConnected && hasEnoughBalance && chain?.id === 41454 && !hasAlreadyMinted) {
      setIsVisible(true);
      handleAutoMint();
    } else if (hasAlreadyMinted) {
      setIsVisible(true);
      // Show notification that user has already minted
      setTimeout(() => setIsVisible(false), 3000);
    }
  }, [profileData]);

  const handleAutoMint = async () => {
    if (!isConnected || !address || !hasEnoughBalance || hasAlreadyMinted) return;

    try {
      // Send payment to recipient
      await sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: mintPrice,
      });
    } catch (error) {
      console.error('Auto-mint payment failed:', error);
      onMintComplete?.(false);
    }
  };

  // Handle minting after payment is confirmed
  useEffect(() => {
    if (isPaymentConfirmed && address) {
      const mintNFT = async () => {
        try {
          const metadata = generateMetadata(profileData);
          
          await writeContract({
            address: contractAddress as `0x${string}`,
            abi: mintABI,
            functionName: 'mintWithMetadata',
            args: [address, metadata],
          });
        } catch (error) {
          console.error('Mint failed after payment:', error);
          onMintComplete?.(false);
        }
      };
      
      mintNFT();
    }
  }, [isPaymentConfirmed, address, profileData]);

  // Handle mint completion
  useEffect(() => {
    if (isConfirmed) {
      onMintComplete?.(true);
      setTimeout(() => setIsVisible(false), 3000);
    } else if (error) {
      onMintComplete?.(false);
      setTimeout(() => setIsVisible(false), 3000);
    }
  }, [isConfirmed, error]);

  if (!isVisible || !isConnected) return null;

  return (
    <div className="profile-edit-nft">
      <div className="edit-nft-content">
        <div className="edit-nft-header">
          <div className="edit-nft-icon">🎨</div>
          <h4>Profile Changes Detected!</h4>
        </div>
        
        <div className="edit-nft-details">
          <p>Your profile edits are being minted as an NFT</p>
          <div className="profile-changes">
            <div className="change-item">
              <span className="change-label">Name:</span>
              <span className="change-value">{profileData?.name}</span>
            </div>
            <div className="change-item">
              <span className="change-label">Title:</span>
              <span className="change-value">{profileData?.title}</span>
            </div>
            <div className="change-item">
              <span className="change-label">Handle:</span>
              <span className="change-value">@{profileData?.handle}</span>
            </div>
          </div>
        </div>

        <div className="edit-nft-status">
          {hasAlreadyMinted && !isConfirming && (
            <div className="status-item already-minted">
              <span>ℹ️ You have already minted your profile NFT</span>
              <small>Limit: 1 per wallet</small>
            </div>
          )}
          
          {isPaymentConfirming && !hasAlreadyMinted && (
            <div className="status-item minting">
              <div className="spinner"></div>
              <span>Processing payment to recipient...</span>
            </div>
          )}
          
          {isConfirming && !hasAlreadyMinted && (
            <div className="status-item minting">
              <div className="spinner"></div>
              <span>Minting your profile NFT with metadata...</span>
            </div>
          )}
          
          {isConfirmed && (
            <div className="status-item success">
              <span>✅ Profile NFT minted successfully!</span>
              <small>Cost: 1 MON | Includes metadata</small>
            </div>
          )}
          
          {(error || paymentError) && (
            <div className="status-item error">
              <span>❌ {paymentError ? 'Payment failed' : 'Minting failed'}</span>
              <small>Please try again</small>
            </div>
          )}
        </div>

        <div className="edit-nft-settings">
          <label className="auto-mint-toggle">
            <input
              type="checkbox"
              checked={autoMintEnabled}
              onChange={(e) => setAutoMintEnabled(e.target.checked)}
            />
            <span>Auto-mint profile changes</span>
          </label>
        </div>

        <button 
          className="close-edit-nft"
          onClick={() => setIsVisible(false)}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ProfileEditNFT;
