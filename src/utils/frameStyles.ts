// 프레임 스타일 유틸리티
export interface FrameStyle {
  id: string;
  name: string;
  category: string;
  description: string;
  preview?: string;
  type: 'solid' | 'gradient' | 'pattern' | 'texture' | 'image';
  style: {
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
    gradient?: {
      colors: string[];
      direction: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
    };
    pattern?: {
      type: 'dots' | 'stripes' | 'stars' | 'hearts' | 'geometric';
      color: string;
      backgroundColor: string;
    };
    texture?: {
      type: 'wood' | 'metal' | 'paper' | 'fabric' | 'marble';
      color: string;
    };
    shadow?: {
      color: string;
      opacity: number;
      radius: number;
      offset: { x: number; y: number };
    };
  };
}

export const frameCategories = [
  { id: 'minimal', name: '미니멀', icon: '◻️' },
  { id: 'classic', name: '클래식', icon: '🖼️' },
  { id: 'decorative', name: '장식적', icon: '✨' },
  { id: 'gradient', name: '그라데이션', icon: '🌈' },
  { id: 'texture', name: '텍스처', icon: '🎨' },
  { id: 'seasonal', name: '시즌', icon: '🍂' },
];

export const frames: FrameStyle[] = [
  // Minimal 카테고리
  {
    id: 'no_frame',
    name: '프레임 없음',
    category: 'minimal',
    description: '깔끔한 무테',
    type: 'solid',
    style: {
      borderWidth: 1,
    },
  },
  {
    id: 'thin_black',
    name: '얇은 검정',
    category: 'minimal',
    description: '심플한 검정 테두리',
    type: 'solid',
    style: {
      borderWidth: 3,
      borderColor: '#000000',
    },
  },
  {
    id: 'thin_white',
    name: '얇은 흰색',
    category: 'minimal',
    description: '깔끔한 흰색 테두리',
    type: 'solid',
    style: {
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
  },
  {
    id: 'thin_gray',
    name: '얇은 회색',
    category: 'minimal',
    description: '중성적인 회색 테두리',
    type: 'solid',
    style: {
      borderWidth: 3,
      borderColor: '#808080',
    },
  },
  {
    id: 'medium_black',
    name: '중간 검정',
    category: 'minimal',
    description: '적당한 두께의 검정 프레임',
    type: 'solid',
    style: {
      borderWidth: 5,
      borderColor: '#000000',
    },
  },

  // Classic 카테고리
  {
    id: 'thick_black',
    name: '두꺼운 검정',
    category: 'classic',
    description: '클래식한 검정 프레임',
    type: 'solid',
    style: {
      borderWidth: 6,
      borderColor: '#000000',
      shadow: {
        color: '#000000',
        opacity: 0.3,
        radius: 4,
        offset: { x: 2, y: 2 },
      },
    },
  },
  {
    id: 'thick_white',
    name: '두꺼운 흰색',
    category: 'classic',
    description: '우아한 흰색 프레임',
    type: 'solid',
    style: {
      borderWidth: 6,
      borderColor: '#FFFFFF',
      shadow: {
        color: '#000000',
        opacity: 0.2,
        radius: 3,
        offset: { x: 1, y: 1 },
      },
    },
  },
  {
    id: 'cream_classic',
    name: '크림 클래식',
    category: 'classic',
    description: '따뜻한 크림색 프레임',
    type: 'solid',
    style: {
      borderWidth: 5,
      borderColor: '#F5F5DC',
      shadow: {
        color: '#8B7355',
        opacity: 0.25,
        radius: 3,
        offset: { x: 1, y: 1 },
      },
    },
  },
  {
    id: 'brown_vintage',
    name: '브라운 빈티지',
    category: 'classic',
    description: '빈티지한 갈색 프레임',
    type: 'solid',
    style: {
      borderWidth: 5,
      borderColor: '#8B4513',
      shadow: {
        color: '#654321',
        opacity: 0.3,
        radius: 4,
        offset: { x: 2, y: 2 },
      },
    },
  },

  // Decorative 카테고리
  {
    id: 'gold_ornate',
    name: '골드 장식',
    category: 'decorative',
    description: '화려한 금색 프레임',
    type: 'gradient',
    style: {
      borderWidth: 8,
      gradient: {
        colors: ['#FFD700', '#FFA500', '#FF8C00'],
        direction: 'diagonal',
      },
      shadow: {
        color: '#B8860B',
        opacity: 0.4,
        radius: 5,
        offset: { x: 3, y: 3 },
      },
    },
  },
  {
    id: 'silver_elegant',
    name: '실버 우아함',
    category: 'decorative',
    description: '우아한 은색 프레임',
    type: 'gradient',
    style: {
      borderWidth: 6,
      gradient: {
        colors: ['#C0C0C0', '#A9A9A9', '#808080'],
        direction: 'vertical',
      },
      shadow: {
        color: '#696969',
        opacity: 0.3,
        radius: 4,
        offset: { x: 2, y: 2 },
      },
    },
  },
  {
    id: 'rose_gold',
    name: '로즈 골드',
    category: 'decorative',
    description: '로맨틱한 로즈골드',
    type: 'gradient',
    style: {
      borderWidth: 5,
      gradient: {
        colors: ['#E8B4B8', '#D4A574', '#C9A961'],
        direction: 'diagonal',
      },
      shadow: {
        color: '#B87333',
        opacity: 0.3,
        radius: 3,
        offset: { x: 2, y: 2 },
      },
    },
  },
  {
    id: 'copper_antique',
    name: '구리 앤틱',
    category: 'decorative',
    description: '앤틱한 구리색',
    type: 'gradient',
    style: {
      borderWidth: 6,
      gradient: {
        colors: ['#B87333', '#CD853F', '#8B4513'],
        direction: 'horizontal',
      },
      shadow: {
        color: '#654321',
        opacity: 0.35,
        radius: 4,
        offset: { x: 2, y: 2 },
      },
    },
  },

  // Gradient 카테고리
  {
    id: 'sunset_gradient',
    name: '노을 그라데이션',
    category: 'gradient',
    description: '노을처럼 아름다운',
    type: 'gradient',
    style: {
      borderWidth: 4,
      gradient: {
        colors: ['#FF6B6B', '#FFE66D', '#FF6B35'],
        direction: 'horizontal',
      },
    },
  },
  {
    id: 'ocean_gradient',
    name: '오션 그라데이션',
    category: 'gradient',
    description: '바다처럼 시원한',
    type: 'gradient',
    style: {
      borderWidth: 4,
      gradient: {
        colors: ['#667eea', '#764ba2', '#667eea'],
        direction: 'vertical',
      },
    },
  },
  {
    id: 'forest_gradient',
    name: '숲 그라데이션',
    category: 'gradient',
    description: '숲처럼 자연스러운',
    type: 'gradient',
    style: {
      borderWidth: 4,
      gradient: {
        colors: ['#56ab2f', '#a8e6cf', '#56ab2f'],
        direction: 'diagonal',
      },
    },
  },
  {
    id: 'purple_dream',
    name: '보라 꿈',
    category: 'gradient',
    description: '몽환적인 보라색',
    type: 'gradient',
    style: {
      borderWidth: 5,
      gradient: {
        colors: ['#8360c3', '#2ebf91', '#8360c3'],
        direction: 'radial',
      },
    },
  },
  {
    id: 'pink_blush',
    name: '핑크 블러쉬',
    category: 'gradient',
    description: '로맨틱한 핑크',
    type: 'gradient',
    style: {
      borderWidth: 4,
      gradient: {
        colors: ['#ffecd2', '#fcb69f', '#ffecd2'],
        direction: 'horizontal',
      },
    },
  },

  // Texture 카테고리
  {
    id: 'wood_texture',
    name: '우드 텍스처',
    category: 'texture',
    description: '따뜻한 나무 질감',
    type: 'texture',
    style: {
      borderWidth: 8,
      texture: {
        type: 'wood',
        color: '#8B4513',
      },
      shadow: {
        color: '#654321',
        opacity: 0.3,
        radius: 4,
        offset: { x: 2, y: 2 },
      },
    },
  },
  {
    id: 'metal_texture',
    name: '메탈 텍스처',
    category: 'texture',
    description: '모던한 금속 질감',
    type: 'texture',
    style: {
      borderWidth: 6,
      texture: {
        type: 'metal',
        color: '#708090',
      },
      shadow: {
        color: '#2F4F4F',
        opacity: 0.4,
        radius: 3,
        offset: { x: 2, y: 2 },
      },
    },
  },
  {
    id: 'paper_texture',
    name: '페이퍼 텍스처',
    category: 'texture',
    description: '부드러운 종이 질감',
    type: 'texture',
    style: {
      borderWidth: 5,
      texture: {
        type: 'paper',
        color: '#F5F5DC',
      },
      shadow: {
        color: '#D2B48C',
        opacity: 0.2,
        radius: 2,
        offset: { x: 1, y: 1 },
      },
    },
  },
  {
    id: 'fabric_texture',
    name: '패브릭 텍스처',
    category: 'texture',
    description: '고급스러운 천 질감',
    type: 'texture',
    style: {
      borderWidth: 6,
      texture: {
        type: 'fabric',
        color: '#8B008B',
      },
      shadow: {
        color: '#4B0082',
        opacity: 0.3,
        radius: 3,
        offset: { x: 2, y: 2 },
      },
    },
  },
  {
    id: 'marble_texture',
    name: '마블 텍스처',
    category: 'texture',
    description: '고급스러운 대리석',
    type: 'texture',
    style: {
      borderWidth: 7,
      texture: {
        type: 'marble',
        color: '#F8F8FF',
      },
      shadow: {
        color: '#696969',
        opacity: 0.25,
        radius: 4,
        offset: { x: 2, y: 2 },
      },
    },
  },

  // Seasonal 카테고리
  {
    id: 'spring_fresh',
    name: '봄 신선함',
    category: 'seasonal',
    description: '봄날의 신선함',
    type: 'gradient',
    style: {
      borderWidth: 5,
      gradient: {
        colors: ['#FFB6C1', '#98FB98', '#87CEEB'],
        direction: 'diagonal',
      },
    },
  },
  {
    id: 'summer_bright',
    name: '여름 밝음',
    category: 'seasonal',
    description: '여름의 밝은 에너지',
    type: 'gradient',
    style: {
      borderWidth: 4,
      gradient: {
        colors: ['#FFD700', '#FF6347', '#FF1493'],
        direction: 'horizontal',
      },
    },
  },
  {
    id: 'autumn_warm',
    name: '가을 따뜻함',
    category: 'seasonal',
    description: '가을의 따뜻한 색감',
    type: 'gradient',
    style: {
      borderWidth: 6,
      gradient: {
        colors: ['#CD853F', '#D2691E', '#A0522D'],
        direction: 'vertical',
      },
    },
  },
  {
    id: 'winter_cool',
    name: '겨울 차가움',
    category: 'seasonal',
    description: '겨울의 시원한 느낌',
    type: 'gradient',
    style: {
      borderWidth: 5,
      gradient: {
        colors: ['#B0E0E6', '#87CEEB', '#4682B4'],
        direction: 'radial',
      },
    },
  },
];

export const getFramesByCategory = (categoryId: string): FrameStyle[] => {
  return frames.filter(frame => frame.category === categoryId);
};

export const getFrameById = (frameId: string): FrameStyle | undefined => {
  return frames.find(frame => frame.id === frameId);
};

export const applyFrameStyle = (frame: FrameStyle, containerStyle: any = {}): any => {
  const { style } = frame;
  const frameStyle: any = { ...containerStyle };

  if (style.borderWidth) {
    frameStyle.borderWidth = style.borderWidth;
  }

  if (style.borderColor) {
    frameStyle.borderColor = style.borderColor;
  }

  if (style.backgroundColor) {
    frameStyle.backgroundColor = style.backgroundColor;
  }

  // 그라데이션의 경우 외부 라이브러리나 커스텀 컴포넌트 필요
  if (frame.type === 'gradient' && style.gradient) {
    frameStyle.gradient = style.gradient;
  }

  // 그림자 효과
  if (style.shadow) {
    frameStyle.shadowColor = style.shadow.color;
    frameStyle.shadowOpacity = style.shadow.opacity;
    frameStyle.shadowRadius = style.shadow.radius;
    frameStyle.shadowOffset = style.shadow.offset;
    frameStyle.elevation = style.shadow.radius; // Android
  }

  return frameStyle;
};