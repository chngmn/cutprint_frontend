// 필터 효과 유틸리티
export interface FilterEffect {
  id: string;
  name: string;
  category: string;
  description: string;
  intensity?: number;
  preview?: string;
  transform: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
    sepia?: number;
    grayscale?: number;
    blur?: number;
    overlay?: {
      color: string;
      opacity: number;
      blendMode?: string;
    };
  };
}

export const filterCategories = [
  { id: 'classic', name: '클래식', icon: '📷' },
  { id: 'vintage', name: '빈티지', icon: '🎞️' },
  { id: 'modern', name: '모던', icon: '✨' },
  { id: 'artistic', name: '아티스틱', icon: '🎨' },
  { id: 'nature', name: '자연', icon: '🌿' },
  { id: 'portrait', name: '인물', icon: '👤' },
];

export const filters: FilterEffect[] = [
  // Classic 카테고리
  {
    id: 'original',
    name: '원본',
    category: 'classic',
    description: '필터 없음',
    transform: {},
  },
  {
    id: 'bw_classic',
    name: '클래식 흑백',
    category: 'classic',
    description: '깔끔한 흑백 톤',
    transform: {
      grayscale: 1,
      contrast: 1.1,
      brightness: 1.05,
    },
  },
  {
    id: 'high_contrast',
    name: '하이 콘트라스트',
    category: 'classic',
    description: '강렬한 대비',
    transform: {
      contrast: 1.4,
      brightness: 1.1,
      saturation: 1.2,
    },
  },
  {
    id: 'soft_light',
    name: '소프트 라이트',
    category: 'classic',
    description: '부드러운 조명 효과',
    transform: {
      brightness: 1.15,
      contrast: 0.9,
      saturation: 0.95,
      overlay: {
        color: '#ffffff',
        opacity: 0.15,
      },
    },
  },

  // Vintage 카테고리
  {
    id: 'sepia_warm',
    name: '웜 세피아',
    category: 'vintage',
    description: '따뜻한 세피아 톤',
    transform: {
      sepia: 0.8,
      brightness: 1.1,
      contrast: 1.1,
      overlay: {
        color: '#8B4513',
        opacity: 0.2,
      },
    },
  },
  {
    id: 'vintage_film',
    name: '빈티지 필름',
    category: 'vintage',
    description: '필름 카메라 느낌',
    transform: {
      saturation: 0.8,
      contrast: 1.2,
      brightness: 0.95,
      overlay: {
        color: '#D2691E',
        opacity: 0.15,
      },
    },
  },
  {
    id: 'old_photo',
    name: '옛날 사진',
    category: 'vintage',
    description: '오래된 사진 효과',
    transform: {
      sepia: 0.6,
      saturation: 0.7,
      contrast: 0.9,
      brightness: 1.05,
      overlay: {
        color: '#8B7355',
        opacity: 0.25,
      },
    },
  },
  {
    id: 'faded_memories',
    name: '바랜 추억',
    category: 'vintage',
    description: '바래진 사진 느낌',
    transform: {
      saturation: 0.6,
      contrast: 0.8,
      brightness: 1.2,
      overlay: {
        color: '#F5E6D3',
        opacity: 0.3,
      },
    },
  },

  // Modern 카테고리
  {
    id: 'crisp',
    name: '크리스프',
    category: 'modern',
    description: '선명하고 깔끔한',
    transform: {
      contrast: 1.3,
      saturation: 1.15,
      brightness: 1.05,
    },
  },
  {
    id: 'cool_tone',
    name: '쿨 톤',
    category: 'modern',
    description: '시원한 색감',
    transform: {
      saturation: 1.1,
      hue: 200,
      overlay: {
        color: '#4A90E2',
        opacity: 0.15,
      },
    },
  },
  {
    id: 'warm_glow',
    name: '웜 글로우',
    category: 'modern',
    description: '따뜻한 빛',
    transform: {
      brightness: 1.1,
      saturation: 1.05,
      overlay: {
        color: '#FFB347',
        opacity: 0.2,
      },
    },
  },
  {
    id: 'dramatic',
    name: '드라마틱',
    category: 'modern',
    description: '극적인 효과',
    transform: {
      contrast: 1.5,
      saturation: 1.3,
      brightness: 0.9,
    },
  },

  // Artistic 카테고리
  {
    id: 'cinematic',
    name: '시네마틱',
    category: 'artistic',
    description: '영화 같은 느낌',
    transform: {
      contrast: 1.2,
      saturation: 0.9,
      overlay: {
        color: '#1a1a1a',
        opacity: 0.1,
      },
    },
  },
  {
    id: 'ethereal',
    name: '몽환적',
    category: 'artistic',
    description: '꿈같은 분위기',
    transform: {
      brightness: 1.2,
      contrast: 0.8,
      saturation: 0.85,
      blur: 0.5,
      overlay: {
        color: '#E6E6FA',
        opacity: 0.25,
      },
    },
  },
  {
    id: 'neon_glow',
    name: '네온 글로우',
    category: 'artistic',
    description: '네온사인 느낌',
    transform: {
      contrast: 1.4,
      saturation: 1.5,
      overlay: {
        color: '#FF00FF',
        opacity: 0.1,
      },
    },
  },
  {
    id: 'oil_painting',
    name: '유화',
    category: 'artistic',
    description: '유화 그림 효과',
    transform: {
      saturation: 1.2,
      contrast: 1.1,
      blur: 1,
      overlay: {
        color: '#8B4513',
        opacity: 0.1,
      },
    },
  },

  // Nature 카테고리
  {
    id: 'forest_green',
    name: '포레스트 그린',
    category: 'nature',
    description: '숲속 느낌',
    transform: {
      saturation: 1.1,
      hue: 120,
      overlay: {
        color: '#228B22',
        opacity: 0.1,
      },
    },
  },
  {
    id: 'golden_hour',
    name: '골든 아워',
    category: 'nature',
    description: '황금빛 시간',
    transform: {
      brightness: 1.15,
      saturation: 1.1,
      overlay: {
        color: '#FFD700',
        opacity: 0.2,
      },
    },
  },
  {
    id: 'ocean_blue',
    name: '오션 블루',
    category: 'nature',
    description: '바다 같은 청량감',
    transform: {
      saturation: 1.1,
      hue: 240,
      overlay: {
        color: '#4682B4',
        opacity: 0.15,
      },
    },
  },
  {
    id: 'sunset_sky',
    name: '노을 하늘',
    category: 'nature',
    description: '노을 같은 따뜻함',
    transform: {
      brightness: 1.1,
      saturation: 1.2,
      overlay: {
        color: '#FF4500',
        opacity: 0.2,
      },
    },
  },

  // Portrait 카테고리
  {
    id: 'skin_smooth',
    name: '스킨 스무스',
    category: 'portrait',
    description: '부드러운 피부톤',
    transform: {
      brightness: 1.1,
      contrast: 0.95,
      saturation: 0.9,
      blur: 0.3,
      overlay: {
        color: '#FFF8DC',
        opacity: 0.15,
      },
    },
  },
  {
    id: 'rosy_cheeks',
    name: '로지 볼',
    category: 'portrait',
    description: '장밋빛 볼',
    transform: {
      brightness: 1.05,
      saturation: 1.1,
      overlay: {
        color: '#FFB6C1',
        opacity: 0.1,
      },
    },
  },
  {
    id: 'soft_focus',
    name: '소프트 포커스',
    category: 'portrait',
    description: '부드러운 초점',
    transform: {
      brightness: 1.08,
      contrast: 0.9,
      blur: 0.4,
      overlay: {
        color: '#FFFAF0',
        opacity: 0.2,
      },
    },
  },
  {
    id: 'elegant',
    name: '우아한',
    category: 'portrait',
    description: '고급스러운 느낌',
    transform: {
      contrast: 1.1,
      saturation: 0.95,
      brightness: 1.05,
      overlay: {
        color: '#F5F5DC',
        opacity: 0.1,
      },
    },
  },
];

export const getFiltersByCategory = (categoryId: string): FilterEffect[] => {
  return filters.filter(filter => filter.category === categoryId);
};

export const getFilterById = (filterId: string): FilterEffect | undefined => {
  return filters.find(filter => filter.id === filterId);
};

export const applyFilterToStyle = (filter: FilterEffect): any => {
  const { transform } = filter;
  const style: any = {};

  if (transform.overlay) {
    style.overlay = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: transform.overlay.color,
      opacity: transform.overlay.opacity,
    };
  }

  return style;
};