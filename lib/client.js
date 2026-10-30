/**
 * Client half of @deepseek-ai/dsh-mdl-promptboost: the row configuration card on
 * the Plugins page. Registered under the row key "<bundle>#<row id>" so the page
 * opens our row as its own page and hands us the Host-owned ConfigPageForm.
 */
window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-mdl-promptboost",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    try {
      var React = require("react");
      var h = React.createElement;
      var KEY = "@deepseek-ai/dsh-mdl-promptboost#mdl-promptboost";
      var inputStyle = { padding: "6px 8px", borderRadius: "6px", border: "1px solid rgba(127,127,127,.45)", font: "inherit", background: "transparent", color: "inherit" };
      var labelStyle = { display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" };

      function Card(props) {
        var view = props.view, form = props.form;
        if (view !== "page" || form === undefined) return null;
        var state = form.state || {};
        var value = state.value || {};
        var d = React.useState({ enabled: value.enabled !== false, prompt: typeof value.prompt === "string" ? value.prompt : "", extraText: typeof value.extraText === "string" ? value.extraText : "" });
        var draft = d[0], setDraft = d[1];
        var n = React.useState("");
        var note = n[0], setNote = n[1];
        var disabled = state.writable === false || state.status !== "ready";
        var save = function () {
          setNote("保存中…");
          var result;
          try {
            result = form.mutate([
              { op: "set", path: ["enabled"], value: draft.enabled },
              { op: "set", path: ["prompt"], value: draft.prompt },
              { op: "set", path: ["extraText"], value: draft.extraText },
            ], state.revision);
          } catch (error) { setNote("保存失败：" + String(error)); return }
          Promise.resolve(result).then(function (ok) { setNote(ok ? "已保存，立即生效" : "主机拒绝写入") },
            function (error) { setNote("保存失败：" + String(error)) });
        };
        return h("div", { style: { display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "8px", border: "1px solid rgba(127,127,127,.35)" } }, [
          h("label", { key: "enabled", style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" } }, [
            h("input", { key: "cb", type: "checkbox", checked: draft.enabled, disabled: disabled, onChange: function (e) { setDraft(Object.assign({}, draft, { enabled: e.target.checked })) } }),
            h("span", { key: "t" }, "启用执行强度提示"),
          ]),
          h("label", { key: "prompt", style: labelStyle }, [
            h("span", { key: "t" }, "提示文本（留空 = 内置核心那句）"),
            h("textarea", { key: "ta", rows: 4, style: inputStyle, value: draft.prompt, disabled: disabled, onChange: function (e) { setDraft(Object.assign({}, draft, { prompt: e.target.value })) } }),
          ]),
          h("label", { key: "extra", style: labelStyle }, [
            h("span", { key: "t" }, "追加在内置核心之后（可留空）"),
            h("input", { key: "in", type: "text", style: inputStyle, value: draft.extraText, disabled: disabled, onChange: function (e) { setDraft(Object.assign({}, draft, { extraText: e.target.value })) } }),
          ]),
          h("div", { key: "actions", style: { display: "flex", alignItems: "center", gap: "10px" } }, [
            h("button", { key: "save", type: "button", disabled: disabled, onClick: save, style: { padding: "6px 14px", borderRadius: "6px", cursor: disabled ? "default" : "pointer", font: "inherit" } }, "保存"),
            h("span", { key: "note", style: { fontSize: "12px", opacity: 0.75 } }, note),
          ]),
        ]);
      }

      var inject = ["slots"];
      function apply(ctx) {
        window.__PB_APPLIED__ = true;
        try {
          ctx.slots.inject("plugins.row.config", function () {
            return ctx.slots.register({ name: "plugins.row.config", key: KEY, label: "执行强度提示" }, Card)
          });
          window.__PB_REGISTERED__ = KEY;
        } catch (error) { window.__PB_APPLY_ERROR__ = String(error) }
      }
      exports.name = "dsh-mdl-promptboost";
      exports.apply = apply;
      exports.inject = inject;
    } catch (error) { window.__PB_ERROR__ = String(error) }
    return module.exports;
  },
});
