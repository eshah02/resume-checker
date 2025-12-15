import styles from "./Loader.module.css";

export default function Loader() {
  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        Processing — this may take a few seconds...
      </div>
    </div>
  );
}