# dsh-mdl-promptboost

DeepSeek Harness bundle plugin that injects a small, engineered **execution-intensity prompt** into the system prompt. It favors verified work over thrift: run the checks, report the conclusion first, and do not claim something was verified unless it was.

The plugin adds a configuration card to the DSH plugin manager, a runtime tool named `promptboost`, and the `/dsh-boost` slash command.

## Features

- Injects one system-prompt section before DSH's plan policy.
- Three text sources, highest priority first:
  1. runtime override from the `promptboost` tool or `/dsh-boost text ...`;
  2. the `prompt` value saved in the plugin card;
  3. the built-in execution-intensity core.
- Optional `extraText` appended after the selected prompt.
- Enable/disable immediately, without restarting the host.
- No filesystem writes, network calls, subprocesses, or dynamic code loading.

## Install

Install it as a DSH bundle with the DSH plugin manager, or from this repository:

```powershell
dsh plugin --profile <profile> add --ignore-scripts "github:ggfgfgf-on/dsh-mdl-promptboost"
```

For a reproducible install, pin the commit:

```powershell
dsh plugin --profile <profile> add --ignore-scripts "github:ggfgfgf-on/dsh-mdl-promptboost#<commit-sha>"
```

Verify that the bundle patch inserted its row:

```powershell
dsh --profile <profile> --dump-config
```

Expected row id: `mdl-promptboost`.

## Configuration

Open the plugin manager page and select **执行强度提示**. The host-owned form writes three keys:

| Key | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Master switch. When off, nothing is injected. |
| `prompt` | `""` | Full replacement text. Empty means use the built-in core. |
| `extraText` | `""` | Appended after the selected prompt; may be empty. |

The bundled patch sets `enabled: true` and leaves the two text fields at their defaults.

## Runtime control

Slash command:

```text
/dsh-boost                     show current state and source
/dsh-boost on                  enable
/dsh-boost off                 disable
/dsh-boost text <new text>     temporary runtime override
/dsh-boost reset               drop the override
```

Model tool:

```text
promptboost({ enabled?: "on" | "off", text?: string })
```

`text: ""` clears the runtime override. Runtime changes live for the current host process; they are not persisted.

## How it works

- `lib/index.js` declares the bundle, config schema, host-side system-prompt section, tool, and command.
- `lib/client.js` registers the row configuration card on the plugin manager page.
- `cordis.patch.yml` inserts the `mdl-promptboost` row into the DSH composition.

The prompt is read lazily on every render, so changes from the configuration card or runtime controls take effect in the same process.

## Compatibility

- DSH: `>=0.2.0-rc.2 <0.3.0`
- Node.js: `>=22.19`
- Runtime: pure JavaScript, no native build step

## Repository layout

```text
lib/index.js        host-side plugin, prompt injection, tool, command
lib/client.js       plugin-manager configuration card
cordis.patch.yml    bundle patch (one row)
package.json        package and DSH manifest metadata
```

## License

MIT
