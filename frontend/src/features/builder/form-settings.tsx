import { MessageSquareCheck, Palette } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import styles from "./form-settings.module.css";

export function FormSettings({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Form settings" onClose={onClose}>
      <ul className={styles.placeholders}>
        <li className={styles.placeholder}>
          <span className={styles.icon} aria-hidden="true">
            <Palette size={19} />
          </span>
          <div className={styles.copy}>
            <h3>Theme</h3>
            <p>Customize colors, fonts, and background</p>
            <span className={styles.badge}>Coming soon</span>
          </div>
        </li>
        <li className={styles.placeholder}>
          <span className={styles.icon} aria-hidden="true">
            <MessageSquareCheck size={19} />
          </span>
          <div className={styles.copy}>
            <h3>Thank-you screen</h3>
            <p>Customize the completion screen</p>
            <span className={styles.badge}>Coming soon</span>
          </div>
        </li>
      </ul>
    </Modal>
  );
}
