
export const walletService = {
  isMetaMaskInstalled: () => {
    return typeof window !== 'undefined' && (window as any).ethereum !== undefined;
  },

  connect: async (): Promise<string | null> => {
    if (!walletService.isMetaMaskInstalled()) {
      alert("MetaMask is not installed. Please install it to connect your wallet.");
      return null;
    }

    try {
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      return accounts[0];
    } catch (error) {
      console.error("User rejected the connection", error);
      return null;
    }
  },

  shortenAddress: (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  },

  onAccountsChanged: (callback: (accounts: string[]) => void) => {
    if (walletService.isMetaMaskInstalled()) {
      (window as any).ethereum.on('accountsChanged', callback);
    }
  }
};
