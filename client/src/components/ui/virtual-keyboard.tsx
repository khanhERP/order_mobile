import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Delete, ChevronUp, Space } from "lucide-react";
import { cn } from "@/lib/utils";

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  className?: string;
  isVisible?: boolean;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onEnter,
  className,
  isVisible = true,
}) => {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  const numberKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  const topRowKeys = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
  const middleRowKeys = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
  const bottomRowKeys = ["z", "x", "c", "v", "b", "n", "m"];

  const symbolKeys = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"];
  const specialChars = ["-", "=", "[", "]", "\\", ";", "'", ",", ".", "/"];

  const handleKeyPress = (key: string) => {
    let finalKey = key;

    if (key.match(/[a-z]/)) {
      if (isShiftPressed || isCapsLock) {
        finalKey = key.toUpperCase();
      }
    } else if (key.match(/[0-9]/) && isShiftPressed) {
      const symbolIndex = numberKeys.indexOf(key);
      if (symbolIndex !== -1) {
        finalKey = symbolKeys[symbolIndex];
      }
    }

    onKeyPress(finalKey);

    // Reset shift after key press (but not caps lock)
    if (isShiftPressed) {
      setIsShiftPressed(false);
    }
  };

  const handleShift = () => {
    setIsShiftPressed(!isShiftPressed);
  };

  const handleCapsLock = () => {
    setIsCapsLock(!isCapsLock);
    if (isShiftPressed) {
      setIsShiftPressed(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className={cn("p-4 bg-gray-50 border shadow-lg", className)}>
      <div className="space-y-2">
        {/* Number Row */}
        <div className="flex gap-1 justify-center">
          {numberKeys.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 text-xs"
              onClick={() => handleKeyPress(key)}
            >
              {isShiftPressed ? symbolKeys[numberKeys.indexOf(key)] : key}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-12 h-8 p-0 text-xs"
            onClick={onBackspace}
          >
            <Delete className="w-3 h-3" />
          </Button>
        </div>

        {/* Top Row */}
        <div className="flex gap-1 justify-center">
          {topRowKeys.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 text-xs"
              onClick={() => handleKeyPress(key)}
            >
              {isShiftPressed || isCapsLock ? key.toUpperCase() : key}
            </Button>
          ))}
        </div>

        {/* Middle Row */}
        <div className="flex gap-1 justify-center">
          <Button
            variant={isCapsLock ? "default" : "outline"}
            size="sm"
            className="w-12 h-8 p-0 text-xs"
            onClick={handleCapsLock}
          >
            Caps
          </Button>
          {middleRowKeys.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 text-xs"
              onClick={() => handleKeyPress(key)}
            >
              {isShiftPressed || isCapsLock ? key.toUpperCase() : key}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-12 h-8 p-0 text-xs"
            onClick={onEnter}
          >
            Enter
          </Button>
        </div>

        {/* Bottom Row */}
        <div className="flex gap-1 justify-center">
          <Button
            variant={isShiftPressed ? "default" : "outline"}
            size="sm"
            className="w-12 h-8 p-0 text-xs"
            onClick={handleShift}
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
          {bottomRowKeys.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 text-xs"
              onClick={() => handleKeyPress(key)}
            >
              {isShiftPressed || isCapsLock ? key.toUpperCase() : key}
            </Button>
          ))}
        </div>

        {/* Space and Special Characters */}
        <div className="flex gap-1 justify-center">
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 text-xs"
            onClick={() => handleKeyPress(",")}
          >
            ,
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-32 h-8 p-0 text-xs flex items-center justify-center"
            onClick={() => handleKeyPress(" ")}
          >
            <Space className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 text-xs"
            onClick={() => handleKeyPress(".")}
          >
            .
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 text-xs"
            onClick={() => handleKeyPress("@")}
          >
            @
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VirtualKeyboard;