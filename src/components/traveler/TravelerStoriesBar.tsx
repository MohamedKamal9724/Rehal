import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getAllStories, DestinationStory } from '../../lib/travelerFeedData';
import { TravelerStoryModal } from './TravelerStoryModal';
import { UILanguage } from '../../types';

interface TravelerStoriesBarProps {
  uiLang: UILanguage;
  onSelectAgency?: (agencyId: string) => void;
  onOpenStoryCreator?: () => void;
  refreshTrigger?: number;
}

export const TravelerStoriesBar: React.FC<TravelerStoriesBarProps> = ({
  uiLang,
  onSelectAgency,
  onOpenStoryCreator,
  refreshTrigger,
}) => {
  const isAr = uiLang === 'ar';
  const [stories, setStories] = useState<DestinationStory[]>(() => getAllStories());
  const [selectedStory, setSelectedStory] = useState<DestinationStory | null>(null);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setStories(getAllStories());
  }, [refreshTrigger]);

  const handleOpenStory = (story: DestinationStory) => {
    setSelectedStory(story);
    setViewedStoryIds((prev) => new Set(prev).add(story.id));
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
  };

  const handleNextStory = () => {
    if (!selectedStory) return;
    const currentIdx = stories.findIndex((s) => s.id === selectedStory.id);
    if (currentIdx < stories.length - 1) {
      const nextStory = stories[currentIdx + 1];
      setSelectedStory(nextStory);
      setViewedStoryIds((prev) => new Set(prev).add(nextStory.id));
    } else {
      setSelectedStory(null);
    }
  };

  const handlePrevStory = () => {
    if (!selectedStory) return;
    const currentIdx = stories.findIndex((s) => s.id === selectedStory.id);
    if (currentIdx > 0) {
      const prevStory = stories[currentIdx - 1];
      setSelectedStory(prevStory);
      setViewedStoryIds((prev) => new Set(prev).add(prevStory.id));
    }
  };

  return (
    <div className="w-full">
      {/* Horizontal Scrollable Stories Container */}
      <div 
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-2 px-1 scrollbar-none touch-pan-x"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {onOpenStoryCreator && (
          <button
            type="button"
            onClick={onOpenStoryCreator}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none transition-transform active:scale-95"
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-dashed border-[#C4A177] bg-[#FAF7F2] hover:bg-[#EDE0CC]/60 flex items-center justify-center transition-all group-hover:scale-105 shadow-2xs relative">
              <div className="w-8 h-8 rounded-full bg-[#44200F] text-[#C4A177] flex items-center justify-center shadow-xs">
                <Plus className="w-4 h-4" />
              </div>
            </div>
            <div className="text-center w-20 truncate">
              <span className="text-[11px] sm:text-xs font-bold text-[#44200F] block truncate">
                {isAr ? '+ إضافة ستوري' : '+ New Story'}
              </span>
            </div>
          </button>
        )}

        {stories.map((story) => {
          const isViewed = viewedStoryIds.has(story.id);

          return (
            <button
              key={story.id}
              type="button"
              onClick={() => handleOpenStory(story)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none transition-transform active:scale-95"
            >
              {/* Instagram Gradient Ring Container */}
              <div 
                className={`w-16 h-16 sm:w-18 sm:h-18 p-[2.5px] rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs ${
                  isViewed
                    ? 'ring-2 ring-slate-300 bg-slate-200'
                    : 'bg-gradient-to-tr from-[#EA580C] via-[#C4A177] to-[#E1306C]'
                }`}
              >
                {/* White Inner Gap Ring */}
                <div className="w-full h-full p-[2px] bg-white rounded-full overflow-hidden">
                  <img
                    src={story.coverImage}
                    alt={isAr ? story.destinationAr : story.destinationEn}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Destination Label */}
              <div className="text-center w-20 truncate">
                <span className={`text-[11px] sm:text-xs block truncate ${
                  isViewed ? 'text-slate-500 font-medium' : 'text-[#44200F] font-bold'
                }`}>
                  {isAr ? story.destinationAr : story.destinationEn}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Story Player Modal */}
      <TravelerStoryModal
        story={selectedStory}
        isOpen={Boolean(selectedStory)}
        onClose={handleCloseStory}
        uiLang={uiLang}
        onSelectNextStory={handleNextStory}
        onSelectPrevStory={handlePrevStory}
        onSelectAgency={onSelectAgency}
      />
    </div>
  );
};

