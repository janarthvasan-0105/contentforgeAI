'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Search, 
  Target, 
  FileText, 
  Aperture, 
  Video, 
  Send
} from 'lucide-react';

interface AgentsMegaMenuProps {
  isOpen: boolean;
}

const AGENTS = [
  {
    id: 'cato',
    name: 'Cato',
    role: 'RESEARCHER',
    icon: Search,
  },
  {
    id: 'vela',
    name: 'Vela',
    role: 'STRATEGIST',
    icon: Target,
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'COPYWRITER',
    icon: FileText,
  },
  {
    id: 'iris',
    name: 'Iris',
    role: 'ART DIRECTOR',
    icon: Aperture,
  },
  {
    id: 'kade',
    name: 'Kade',
    role: 'VIDEO PRODUCER',
    icon: Video,
  },
  {
    id: 'nova',
    name: 'Nova',
    role: 'DISTRIBUTOR',
    icon: Send,
  }
];

export default function AgentsMegaMenu({ isOpen }: AgentsMegaMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -5, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.99 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-[100%] left-0 w-full z-50 pt-2 flex justify-center pointer-events-none"
        >
          {/* Main Card */}
          <div className="bg-white rounded-[20px] border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex flex-col md:flex-row w-[700px] max-w-[90vw] pointer-events-auto">
            
            {/* Left Column */}
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
              <div>
                <h2 className="text-[26px] leading-[1.2] font-medium tracking-tight text-black mb-4">
                  Six specialists.<br />
                  One calm control room.
                </h2>
              </div>
              
              <div className="mt-8">
                <Link 
                  href="/agents" 
                  className="text-[14px] font-medium text-black/60 hover:text-black transition"
                >
                  See overview
                </Link>
              </div>
            </div>

            {/* Right Column (Agents List) */}
            <div className="flex-1 p-8 md:p-10 bg-[#FAFAFA] border-t md:border-t-0 md:border-l border-black/5">
              <div className="text-[12px] font-medium text-black/40 mb-6">
                Agents
              </div>

              <div className="flex flex-col gap-2">
                {AGENTS.map((agent) => (
                  <Link 
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="flex items-center gap-3 py-2 group"
                  >
                    <agent.icon size={18} className="text-black/40 group-hover:text-black transition" strokeWidth={2} />
                    <span className="text-[15px] font-medium text-black/70 group-hover:text-black transition">
                      {agent.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
