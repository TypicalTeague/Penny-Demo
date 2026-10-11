import React from 'react';

interface IPhoneShellProps {
  children: React.ReactNode;
}

export const IPhoneShell: React.FC<IPhoneShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#121214] p-0 sm:py-6 sm:px-4 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',Helvetica,Arial,sans-serif]">
      {/* Phone container */}
      <div className="w-full h-screen sm:h-[844px] sm:max-h-[92vh] sm:w-[390px] sm:rounded-[50px] bg-black sm:p-[10px] sm:shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.12)] flex flex-col relative transition-all">
        {/* Hardware Frame Screen Container */}
        <div className="w-full h-full bg-white sm:rounded-[42px] overflow-hidden flex flex-col relative shadow-inner">
          {/* iOS Status Bar */}
          <div className="h-11 w-full bg-white/95 backdrop-blur-md flex items-center justify-between px-7 shrink-0 z-40 select-none">
            {/* Time */}
            <span className="text-[14px] font-semibold tracking-tight text-black">
              9:41
            </span>

            {/* Dynamic Island Pill */}
            <div className="hidden sm:flex items-center justify-center w-[114px] h-[28px] bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a] mr-auto ml-2.5"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#0a192f] ml-auto mr-2.5"></div>
            </div>

            {/* Status Icons: Cellular, Wi-Fi, Battery */}
            <div className="flex items-center space-x-1.5 text-black">
              {/* Cellular signal */}
              <svg className="w-4 h-3.5 fill-current" viewBox="0 0 17 12">
                <rect x="0" y="9" width="2.5" height="3" rx="0.5" />
                <rect x="4" y="6" width="2.5" height="6" rx="0.5" />
                <rect x="8" y="3" width="2.5" height="9" rx="0.5" />
                <rect x="12" y="0" width="2.5" height="12" rx="0.5" />
              </svg>
              {/* 5G label */}
              <span className="text-[11px] font-bold text-black tracking-tighter">
                5G
              </span>
              {/* Battery */}
              <div className="w-5 h-2.5 border-[1.5px] border-black rounded-[3px] p-[1px] flex items-center relative ml-0.5">
                <div className="h-full w-full bg-black rounded-[1px]"></div>
                <div className="w-[1.5px] h-1.5 bg-black absolute -right-[2.5px] top-[1.5px] rounded-r-sm"></div>
              </div>
            </div>
          </div>

          {/* Screen Body */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
            {children}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="h-5 w-full bg-white flex items-center justify-center shrink-0 select-none pb-1">
            <div className="w-32 h-1 bg-black/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Required unobtrusive prototype disclaimer beneath the phone */}
      <footer className="mt-3 text-center select-none">
        <p className="text-[11px] font-normal tracking-wide text-zinc-400">
          Interactive iMessage prototype · Paper investing only
        </p>
      </footer>
    </div>
  );
};
