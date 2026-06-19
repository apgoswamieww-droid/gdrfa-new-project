import { Link } from "react-router-dom";
import { Heading, Text } from "../../component/Typography/Typography";
import { useTheme, PRESET_COLORS } from "../../context/ThemeContext";

const ColorSwatch = ({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-10 h-10 2xl:w-12 2xl:h-12 rounded-full transition-all cursor-pointer ${
      selected ? "ring-2 ring-offset-2 ring-secondary scale-110" : "hover:scale-105"
    }`}
    style={{ backgroundColor: color }}
    title={color}
  />
);

const AccountSettings = () => {
  const { primaryColor, setPrimaryColor } = useTheme();

  return (
    <div className="h-full flex flex-col space-y-6">
      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 text-secondary/60 hover:text-secondary transition-colors w-fit"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="rtl:rotate-180">
          <path d="M12.5 16.6L6.25 10L12.5 3.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-semibold">Back to Dashboard</span>
      </Link>

      <div className="w-full bg-white 2xl:rounded-2xl rounded-xl p-4 2xl:p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <Heading variant="h2" className="font-bold text-secondary">
            Account Settings
          </Heading>
        </div>

        <div className="max-w-2xl">
          {/* Theme Customization */}
          <div className="space-y-6">
            <Heading variant="h4" className="font-bold text-secondary pb-2 border-b border-gray-100">
              Theme Customization
            </Heading>

            {/* Primary Color */}
            <div>
              <Text variant="textBase" className="font-bold text-secondary mb-3">
                Primary Color
              </Text>
              <Text variant="textXs" className="text-gray-400 mb-4">
                Choose your preferred accent color for the interface
              </Text>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((color) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    selected={primaryColor.toLowerCase() === color.toLowerCase()}
                    onClick={() => setPrimaryColor(color)}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Text variant="textXs" className="text-gray-400">Custom:</Text>
                <div className="relative">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-full border-2 border-gray-200 cursor-pointer p-0.5"
                  />
                </div>
                <Text variant="textXs" className="font-mono text-gray-500">
                  {primaryColor}
                </Text>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6">
              <Text variant="textBase" className="font-bold text-secondary mb-3">
                Preview
              </Text>
              <div className="flex flex-wrap gap-3">
                <div className="w-10 h-10 rounded-full bg-primary" />
                <div className="w-10 h-10 rounded-full bg-primary/80" />
                <div className="w-10 h-10 rounded-full bg-primary/60" />
                <div className="w-10 h-10 rounded-full bg-primary/40" />
                <div className="w-10 h-10 rounded-full bg-primary/20" />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-4 py-1.5 rounded-full bg-primary text-white text-sm font-bold">Primary</span>
                <span className="px-4 py-1.5 rounded-full bg-secondary text-white text-sm font-bold">Secondary</span>
                <span className="px-4 py-1.5 rounded-full border-2 border-primary text-primary text-sm font-bold">Outlined</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-10 pt-6 border-t border-gray-100">
          <Link
            to="/dashboard"
            className="flex items-center justify-center font-bold text-sm rounded-lg px-6 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
