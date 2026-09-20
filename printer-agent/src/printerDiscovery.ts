// ===================================================================
// Windows Printer Discovery Service
// Enumerates installed Windows printers using native PowerShell commands
// ===================================================================

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface DetectedPrinter {
  name: string;
  isDefault: boolean;
  connectionType: "wireless" | "usb";
  printerType: "all" | "bw" | "color";
}

export async function discoverWindowsPrinters(): Promise<DetectedPrinter[]> {
  try {
    // Run PowerShell command to get installed Windows printers
    const psCommand = `powershell -NoProfile -Command "Get-Printer | Select-Object Name, PortName, Default | ConvertTo-Json"`;
    const { stdout } = await execAsync(psCommand);

    if (!stdout.trim()) {
      return getFallbackPrinters();
    }

    const parsed = JSON.parse(stdout);
    const printerList = Array.isArray(parsed) ? parsed : [parsed];

    return printerList.map((p: any) => {
      const name = p.Name || "Unnamed Printer";
      const port = (p.PortName || "").toLowerCase();
      const isWireless = port.includes("ip_") || port.includes("tcp") || port.includes("wsd") || port.includes("http");
      const nameLower = name.toLowerCase();
      const isColor = nameLower.includes("color") || nameLower.includes("inkjet") || nameLower.includes("photo");

      return {
        name,
        isDefault: Boolean(p.Default),
        connectionType: isWireless ? "wireless" : "usb",
        printerType: isColor ? "color" : "bw",
      };
    });
  } catch (err) {
    console.warn("Could not query Windows OS printer spooler, using fallback printers:", err);
    return getFallbackPrinters();
  }
}

function getFallbackPrinters(): DetectedPrinter[] {
  return [
    {
      name: "Shop Laser Printer (B&W)",
      isDefault: true,
      connectionType: "wireless",
      printerType: "bw",
    },
    {
      name: "Shop Inkjet Color Printer",
      isDefault: false,
      connectionType: "usb",
      printerType: "color",
    },
  ];
}
