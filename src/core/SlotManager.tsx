import { create } from 'zustand';
import React from 'react';

type SlotComponent = React.ComponentType<any>;

interface SlotRegistryState {
  slots: Record<string, SlotComponent[]>;
  inject: (slotName: string, component: SlotComponent) => void;
  remove: (slotName: string, component: SlotComponent) => void;
}

/**
 * SlotManager: Manages UI slots across the application, allowing decoupled plugins
 * to inject their components into predefined shell areas (e.g., GAME_LIST).
 */
export const useSlotStore = create<SlotRegistryState>((set) => ({
  slots: {},
  inject: (slotName, component) => set((state) => ({
    slots: {
      ...state.slots,
      [slotName]: [...(state.slots[slotName] || []), component],
    }
  })),
  remove: (slotName, component) => set((state) => ({
    slots: {
      ...state.slots,
      [slotName]: (state.slots[slotName] || []).filter(c => c !== component),
    }
  })),
}));

/**
 * <Slot /> Component
 * Renders all components injected into the specified slot name.
 */
export const Slot = ({ name, props = {} }: { name: string; props?: any }) => {
  const components = useSlotStore(state => state.slots[name] || []);
  return (
    <>
      {components.map((Comp, i) => (
        <Comp key={i} {...props} />
      ))}
    </>
  );
};
