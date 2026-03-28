import { GraphRenderer } from './components/GraphRenderer';

export const GameFeature = () => {
  return (
    <div className="w-full h-full relative flex flex-col">
      <div className="flex-1 relative w-full h-full">
        <GraphRenderer />
      </div>
    </div>
  );
};
