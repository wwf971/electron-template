



### Sub Apps

The features in `/electron-utils/` are mostly unrelated to each other (always on top, compact window, window control, ...), so each one is demonstrated separately, as a **sub app**:

```text
entry page (gallery)                          sub app
┌──────────────────────────┐                 ┌───────────────────────────┐
│ [search bar............] │  click a card   | [<-gallery]  feature name |
│ ┌──────┐ ┌──────┐ ┌────┐ │ ──────────────> |                           |
│ │always│ │compac│ │wind│ │                 |   demo of this feature    │
│ │on top│ │window│ │ctrl│ │ <────────────── │                           │
│ └──────┘ └──────┘ └────┘ │  exit button    └───────────────────────────┘
└──────────────────────────┘  or Esc key
```

Opening a sub app looks like launching a separate app: it takes the whole window and shows only that feature. Every sub app has an exit-to-gallery button (acceptable, since sub apps are demonstrations, not products). The `Esc` key also exits, and this key is written explicitly on the entry page — some demos (e.g. compact window) hide the normal UI, and without knowing the key the user could get stuck.

### Design choice: one app with sub apps, not one build target per feature

Two approaches were considered for demonstrating multiple unrelated features:

1. **One app: gallery entry page + sub apps (chosen).** One build, one installed copy on disk; switching to another feature happens inside the same app, no need to launch anything else. The Esc key provides a uniform escape from any demo.
2. **Multiple build targets, one small app per feature.** Each demo stays trivially simple, but disk space multiplies with feature count, each new feature adds builder configs/build scripts to maintain, and viewing another feature means opening another app.

The gallery costs a little frontend code (a page switch driven by one store), which is much cheaper than maintaining N build targets. This also matches the "assortment of small OA/utility tools in one app" usage, so the demo app doubles as a working example of that app style.