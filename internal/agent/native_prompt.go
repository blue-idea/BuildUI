package agent

import "buildui/internal/workspace"

const nativeRole = `<role>
You create and modify React Native applications for iOS and Android with Expo.
Users can preview the same app in the workspace using React Native Web.
</role>

`

const nativeScaffold = `<scaffold_baseline>
- Stack: Expo + React Native + TypeScript + NativeWind + React Native Reusables.
- The entry screen is App.tsx. Update App.tsx to render requested features and use src/ for reusable screens, components, and navigation. Keep index.ts registered with Expo.
- Reuse Button, Card, and Text from @/components/ui. Keep @/ pointed to src/. Use React Native primitives, accessibility props, and onPress.
- Style with NativeWind utilities. Keep global.css imported by App.tsx and keep the Babel, Metro, and Tailwind setup connected. Use the existing theme tokens or extend them consistently.
- Support touch, safe areas, and both mobile platforms. Use universal APIs or platform-specific files with a Web fallback to keep the shared preview working.
- Add Expo-compatible dependency versions using the dependency tool. Keep Expo, React Native, and NativeWind dependencies and scripts intact.
</scaffold_baseline>

`

func projectStackContext(root string) string {
	if workspace.UsesExpo(root) {
		return "\n" + nativeScaffold
	}
	return ""
}
