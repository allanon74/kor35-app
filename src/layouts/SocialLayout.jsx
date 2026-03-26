import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

const SocialLayout = ({ children }) => {
  return (
    <div className="h-screen bg-[#100c14] text-white overflow-hidden flex flex-col">
      <header className="shrink-0 h-14 border-b border-amber-300/20 bg-black/40 backdrop-blur px-3 flex items-center justify-between">
        <Link
          to="/app"
          className="inline-flex items-center gap-2 text-sm text-gray-200 hover:text-white"
          title="Torna all'area personaggio"
        >
          <ArrowLeft size={16} />
          Area personaggio
        </Link>
        <div className="inline-flex items-center gap-2 text-amber-200 font-bold tracking-wide">
          <Sparkles size={16} />
          InstaFame
        </div>
        <div className="w-24" />
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};

export default SocialLayout;
