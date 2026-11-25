package agent

import (
	"buildui/internal/config"
	"buildui/internal/workspace"
)

const nativeRole = `<role>
You create and modify React Native applications for iOS and Android with Expo.
Users can preview the same app in the workspace using React Native Web.
</role>

`

const nativeScaffold = `<scaffold_baseline>
- Stack: Expo + React Native + TypeScript + NativeWind + React Native Reusables.
- Reuse Button, Card, and Text from @/components/ui. Keep @/ pointed to src/. Use React Native primitives, accessibility props, and onPress.
- Style with NativeWind and keep global.css imported from the project entry or root layout. Keep the Babel, Metro, and Tailwind setup connected. Use the existing theme tokens or extend them consistently.
- Use Font Awesome for interface icons, via @expo/vector-icons/FontAwesome6. Keep the React Native Web fallback functional for the workspace preview.
- Add Expo-compatible dependency versions using the dependency tool. Keep Expo, React Native, and NativeWind dependencies and scripts intact.
</scaffold_baseline>

`

const nativeRouterScaffold = `<routing>
Use Expo Router with expo-router/entry, src/app/_layout.tsx, and file-based routes in src/app. Keep reusable components outside src/app. Use Stack and Tabs where the screen hierarchy calls for them. When using a (tabs) route group, rewrite src/app/index.tsx with <Redirect href="/(tabs)" /> from expo-router to redirect root traffic to the tabs. Never leave the placeholder HomeScreen in src/app/index.tsx. Wire every visible navigation control to a real destination or action.
</routing>
`

const legacyNativeScaffold = `<routing>
The entry screen is App.tsx. Keep index.ts registered with Expo and preserve the existing navigation unless the user requests a routing migration.
</routing>
`

const nativeDesign = `<mobile_design>
- Design a native iOS/Android interface. Give each screen one core task. At a 390×844 phone viewport, surface essential information and the primary action. Aim for at most 1.5 screens on home and overview screens; allow natural scrolling for reading, feeds, history, and large accessibility text.
- Split competing tasks into secondary screens, details, or modal flows. Use stack navigation for details, segmented controls for sibling content, and a 3–5 item bottom tab bar when there are that many stable top-level destinations. Use sheets for brief filters or actions and full-screen modals for independent create/edit flows.
- Use horizontal browsing for curated subsets or filter chips, and native vertical lists for sequential data. Reserve a bottom action or FAB for a primary action that needs to stay reachable during scroll. Add loading, empty, refresh, and feedback states when the workflow calls for them.
- Keep user input and completed actions in feature state that survives route changes. Use durable storage when that state should survive app restarts. Check that the primary action, its result, and the return path work at both 390×844 and 360×800.
- Use Flexbox and actual device safe-area insets. Keep interactive UI clear of system bars and the keyboard. Target at least 44×44 pt on iOS and 48×48 dp on Android. Use 8/12/16 spacing as a starting rhythm, with room for readable wrapped text.
- Define a consistent typography hierarchy, spacing, and color roles. Avoid marketing heroes, oversized promotional banners, footers, page anchors, desktop columns, and repeated card nesting. Reorganize content when space is tight. Use React Native layouts and mobile interactions.
</mobile_design>
`

func projectStackContext(root string) string {
	if !workspace.UsesExpo(root) {
		if workspace.UsesNext(root) {
			return nextScaffold
		}
		return ""
	}
	routing := legacyNativeScaffold
	if workspace.NativeEntry(root) == config.NativeRouterLayout {
		routing = nativeRouterScaffold
	}
	return "\n" + nativeScaffold + routing + nativeDesign
}

const nextScaffold = `
<scaffold_baseline>
- Preserve Next.js App Router, React, TypeScript, and Tailwind CSS.
- Build the home route in src/app/page.tsx and keep src/app/layout.tsx as the root layout.
- Use Server Components by default. Add 'use client' where browser state, effects, or event handlers are needed.
- Inspect and reuse existing components; add a dependency or component before importing it if it is missing.
- Keep pnpm dev and pnpm build functional. Use App Router route handlers for API endpoints.
</scaffold_baseline>
`
