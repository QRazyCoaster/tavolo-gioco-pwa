--- a/src/utils/audioUtils.ts
+++ b/src/utils/audioUtils.ts
@@ -154,21 +154,26 @@ export const resumeAudio = (type: AudioType): void => {
     }
   } catch (error) {
     console.error(`Error resuming audio ${type}:`, error);
   }
 };
 
-/**
- * Stop background music
- */
-export const stopBackgroundMusic = (): void => {
-  try {
-    console.log('Stopping background music');
-    const audio = audioCache['backgroundMusic'];
-    if (audio) {
-      audio.pause();
-      audio.currentTime = 0;
-    }
-    localStorage.setItem('backgroundMusicEnabled', 'false');
-  } catch (error) {
-    console.error('Error stopping background music:', error);
-  }
-};
+/**
+ * Stop background music
+ */
+export const stopBackgroundMusic = (): void => {
+  try {
+    console.log('Stopping background music');
+    const audio = audioCache['backgroundMusic'];
+    // ← CHANGED: only call pause() if it actually exists and is a function
+    if (audio && typeof audio.pause === 'function') {
+      audio.pause();
+      audio.currentTime = 0;
+    }
+    localStorage.setItem('backgroundMusicEnabled', 'false');
+  } catch (error) {
+    console.error('Error stopping background music:', error);
+  }
+};
