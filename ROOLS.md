{
"goal": [
"Identical UI elements must always look identical",
"There must be a single source of truth for buttons, inputs and cards",
"Shortcuts describe the design system, not pages or features"
],
"layer_order": [
"tokens",
"primitives",
"variants",
"semantic"
],
"tokens": {
"rules": [
"All colors, radii and spacing must come from CSS variables",
"Hex colors, hardcoded rgb() and utility color classes are forbidden",
"Light and dark themes may only change variable values"
]
},
"primitives": {
"allowed": [
"btn",
"icon-btn",
"input",
"textarea",
"checkbox",
"card",
"dialog",
"dropdown"
],
"rules": [
"Primitives define structure and interaction",
"No new primitives may be created without explicit user request"
]
},
"variants": {
"rules": [
"Variants must always be built on top of a primitive",
"Variants define visual appearance, not meaning or role"
],
"allowed": [
"btn-primary",
"btn-ghost",
"btn-danger",
"icon-btn-primary",
"icon-btn-ghost",
"icon-btn-danger"
],
"forbidden": [
"btn-primary-hero",
"btn-danger-sm",
"btn-confirm-large"
]
},
"semantic": {
"rules": [
"Semantic shortcuts represent roles or actions",
"Semantic shortcuts must be aliases only and contain no new styles",
"Semantic shortcuts must be used when an element looks the same everywhere"
],
"examples": {
"buttons": [
"btn-delete",
"btn-confirm",
"btn-cancel"
],
"icons": [
"icon-btn-close",
"icon-btn-edit",
"icon-btn-delete"
]
}
},
"shortcut_restrictions": {
"forbidden": [
"page-specific shortcuts",
"feature-specific shortcuts",
"shortcuts combining role and size",
"shortcuts duplicating existing primitives or variants"
],
"examples": [
"workspace-card",
"page-header-row",
"delete-task-btn",
"btn-danger-sm"
]
},
"where_to_style": {
"single_page": "inline in template",
"single_component": "inside component",
"reusable_role": "semantic shortcut",
"reusable_look": "variant"
},
"change_policy": [
"Do not modify primitives or variants for a single use case",
"Role-specific changes must be applied only to semantic shortcuts"
],
"llm_checklist": [
"Is this a primitive?",
"Is this a visual variant?",
"Is this a semantic role?",
"Is this page- or feature-specific? If yes, do not create a shortcut",
"Does this duplicate an existing shortcut? If yes, do not create a shortcut"
],
"golden_rule": "If unsure, do not create a new shortcut and reuse existing ones"
}
