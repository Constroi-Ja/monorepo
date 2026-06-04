import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Mapeamento semântico → ícone vetorial
// Os nomes das chaves correspondem às buscas no FlatIcon caso queira trocar por PNGs customizados.
const ICON_MAP = {
  // Auth
  'eye-open':              { lib: 'Ionicons',  name: 'eye-outline'              },  // FlatIcon: "eye open"
  'eye-closed':            { lib: 'Ionicons',  name: 'eye-off-outline'          },  // FlatIcon: "eye closed password"
  'key':                   { lib: 'Ionicons',  name: 'key-outline'              },  // FlatIcon: "key lock"
  // Pessoas
  'wave-hand':             { lib: 'MCI',       name: 'hand-wave-outline'        },  // FlatIcon: "wave hand greeting"
  'users-group':           { lib: 'Ionicons',  name: 'people-outline'           },  // FlatIcon: "group users"
  'user-profile':          { lib: 'Ionicons',  name: 'person-outline'           },  // FlatIcon: "user profile"
  'construction-worker':   { lib: 'MCI',       name: 'hard-hat'                 },  // FlatIcon: "construction worker helmet"
  // Ferramentas / Serviços
  'hammer':                { lib: 'Ionicons',  name: 'hammer-outline'           },  // FlatIcon: "hammer tool"
  'wrench':                { lib: 'Ionicons',  name: 'construct-outline'        },  // FlatIcon: "wrench settings"
  // Busca / Navegação
  'search':                { lib: 'Ionicons',  name: 'search-outline'           },  // FlatIcon: "magnifying glass search"
  'location-pin':          { lib: 'Ionicons',  name: 'location-outline'         },  // FlatIcon: "location pin map"
  'home':                  { lib: 'Ionicons',  name: 'home-outline'             },  // FlatIcon: "home house"
  'store':                 { lib: 'MCI',       name: 'store-outline'            },  // FlatIcon: "store shop"
  // Documentos / Pedidos
  'package':               { lib: 'Ionicons',  name: 'cube-outline'             },  // FlatIcon: "package box delivery"
  'clipboard':             { lib: 'Ionicons',  name: 'clipboard-outline'        },  // FlatIcon: "clipboard list"
  'document':              { lib: 'Ionicons',  name: 'document-outline'         },  // FlatIcon: "document file"
  'paperclip':             { lib: 'Ionicons',  name: 'attach-outline'           },  // FlatIcon: "paperclip attachment"
  // Ações
  'camera':                { lib: 'Ionicons',  name: 'camera-outline'           },  // FlatIcon: "camera photo"
  'trash':                 { lib: 'Ionicons',  name: 'trash-outline'            },  // FlatIcon: "trash delete"
  // Data / Tempo
  'calendar':              { lib: 'Ionicons',  name: 'calendar-outline'         },  // FlatIcon: "calendar date"
  // Financeiro
  'money-bag':             { lib: 'Ionicons',  name: 'cash-outline'             },  // FlatIcon: "money bag revenue"
  'credit-card':           { lib: 'Ionicons',  name: 'card-outline'             },  // FlatIcon: "credit card payment"
  'ticket':                { lib: 'MCI',       name: 'ticket-outline'           },  // FlatIcon: "ticket tag"
  // Dashboard
  'bar-chart':             { lib: 'Ionicons',  name: 'bar-chart-outline'        },  // FlatIcon: "bar chart analytics"
  'filing-cabinet':        { lib: 'MCI',       name: 'archive-outline'          },  // FlatIcon: "filing cabinet inventory"
  // Estado / Feedback
  'shopping-cart':         { lib: 'Ionicons',  name: 'cart-outline'             },  // FlatIcon: "shopping cart"
  'celebration':           { lib: 'MCI',       name: 'party-popper'             },  // FlatIcon: "party celebration success"
  // Tema
  'sun':                   { lib: 'Ionicons',  name: 'sunny-outline'            },  // FlatIcon: "sun light mode"
  'moon':                  { lib: 'Ionicons',  name: 'moon-outline'             },  // FlatIcon: "moon dark mode"
  // Extra / navegação
  'settings':              { lib: 'Ionicons',  name: 'settings-outline'         },  // FlatIcon: "settings gear"
  'bag':                   { lib: 'Ionicons',  name: 'bag-outline'              },  // FlatIcon: "shopping bag"
  'delivery':              { lib: 'MCI',       name: 'truck-delivery-outline'   },  // FlatIcon: "delivery truck"
  'star':                  { lib: 'Ionicons',  name: 'star-outline'             },  // FlatIcon: "star rating"
  'checkmark':             { lib: 'Ionicons',  name: 'checkmark-circle-outline' },  // FlatIcon: "checkmark verified"
  'warning':               { lib: 'Ionicons',  name: 'warning-outline'          },  // FlatIcon: "warning alert"
} as const;

export type AppIconName = keyof typeof ICON_MAP;

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

export function AppIcon({ name, size = 24, color }: AppIconProps) {
  const icon = ICON_MAP[name];
  if (icon.lib === 'MCI') {
    return (
      <MaterialCommunityIcons
        name={icon.name as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
        size={size}
        color={color}
      />
    );
  }
  return (
    <Ionicons
      name={icon.name as React.ComponentProps<typeof Ionicons>['name']}
      size={size}
      color={color}
    />
  );
}
