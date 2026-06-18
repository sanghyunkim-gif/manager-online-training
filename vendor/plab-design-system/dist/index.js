"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  AppBar: () => AppBar,
  Badge: () => Badge,
  BottomNav: () => BottomNav,
  BottomNavItem: () => BottomNavItem,
  BottomNavWithSearch: () => BottomNavWithSearch,
  BottomSheet: () => BottomSheet,
  Button: () => Button,
  Card: () => Card,
  CardBody: () => CardBody,
  CardFooter: () => CardFooter,
  CardHeader: () => CardHeader,
  CardImage: () => CardImage,
  Chip: () => Chip,
  Divider: () => Divider,
  FullModal: () => FullModal,
  Input: () => Input,
  List: () => List,
  ListItem: () => ListItem,
  SectionHeader: () => SectionHeader,
  Select: () => Select,
  TabItem: () => TabItem,
  Tabs: () => Tabs,
  Toggle: () => Toggle,
  badgeVariants: () => badgeVariants,
  bottomNavItemVariants: () => bottomNavItemVariants,
  bottomNavVariants: () => bottomNavVariants,
  buttonVariants: () => buttonVariants,
  chipVariants: () => chipVariants,
  dividerVariants: () => dividerVariants,
  inputVariants: () => inputVariants,
  listItemVariants: () => listItemVariants,
  selectVariants: () => selectVariants,
  tabItemVariants: () => tabItemVariants,
  toggleVariants: () => toggleVariants
});
module.exports = __toCommonJS(src_exports);

// components/ui/button.tsx
var React = __toESM(require("react"));
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority = require("class-variance-authority");

// lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
var twMerge = (0, import_tailwind_merge.extendTailwindMerge)({
  extend: {
    classGroups: {
      "font-size": [
        "text-typo-heading-xl",
        "text-typo-heading-lg",
        "text-typo-heading-md",
        "text-typo-heading-sm",
        "text-typo-body-lg",
        "text-typo-body-md",
        "text-typo-body-sm",
        "text-typo-label-lg",
        "text-typo-label-md",
        "text-typo-label-sm"
      ]
    }
  }
});
function cn(...inputs) {
  return twMerge((0, import_clsx.clsx)(inputs));
}

// components/ui/button.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var buttonVariants = (0, import_class_variance_authority.cva)(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        solid: "bg-bg-primary text-[#FFFFFF] shadow-sm hover:bg-bg-primary-hovered hover:shadow-md active:bg-bg-primary-pressed disabled:bg-bg-primary-disabled disabled:text-text-on-primary-disabled",
        soft: "bg-bg-tertiary text-text-on-tertiary hover:bg-bg-tertiary-hovered active:bg-bg-tertiary-pressed disabled:bg-bg-primary-disabled disabled:text-text-on-primary-disabled",
        outline: "border border-border-outlined bg-transparent text-text-on-tertiary hover:bg-bg-tertiary active:bg-bg-tertiary-hovered disabled:border-border-disabled disabled:text-text-tertiary",
        ghost: "bg-transparent text-text-primary hover:bg-bg-surface-secondary active:bg-bg-surface-tertiary disabled:text-text-tertiary",
        danger: "bg-bg-negative text-text-on-negative shadow-sm hover:bg-bg-negative-hovered hover:shadow-md active:bg-bg-negative-pressed disabled:bg-bg-primary-disabled disabled:text-text-on-primary-disabled"
      },
      size: {
        lg: "h-14 px-5 text-typo-label-lg font-semibold rounded-full",
        md: "h-12 px-5 text-typo-label-lg font-semibold rounded-full",
        sm: "h-9 px-5 text-typo-label-md font-semibold rounded-full",
        xs: "h-7 px-5 text-xs font-medium rounded-full"
      },
      iconOnly: {
        true: "p-0",
        false: ""
      }
    },
    compoundVariants: [
      {
        size: "lg",
        className: "[&_svg]:size-5"
      },
      {
        size: "md",
        className: "[&_svg]:size-5"
      },
      {
        size: "sm",
        className: "[&_svg]:size-4"
      },
      {
        size: "xs",
        className: "[&_svg]:h-3.5 [&_svg]:w-3.5"
      },
      {
        size: "lg",
        iconOnly: true,
        className: "w-14"
      },
      {
        size: "md",
        iconOnly: true,
        className: "w-12"
      },
      {
        size: "sm",
        iconOnly: true,
        className: "w-9"
      },
      {
        size: "xs",
        iconOnly: true,
        className: "w-7"
      }
    ],
    defaultVariants: {
      variant: "solid",
      size: "md",
      iconOnly: false
    }
  }
);
var Button = React.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, variant, size, iconOnly, asChild = false } = _b, props = __objRest(_b, ["className", "variant", "size", "iconOnly", "asChild"]);
    const Comp = asChild ? import_react_slot.Slot : "button";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      Comp,
      __spreadValues({
        className: cn(buttonVariants({ variant, size, iconOnly, className })),
        ref
      }, props)
    );
  }
);
Button.displayName = "Button";

// components/ui/input.tsx
var React2 = __toESM(require("react"));
var import_class_variance_authority2 = require("class-variance-authority");
var import_jsx_runtime2 = require("react/jsx-runtime");
var inputVariants = (0, import_class_variance_authority2.cva)(
  "w-full min-w-0 rounded-full border text-text-primary placeholder:text-text-disabled transition-[background-color,border-color,color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring-focus disabled:pointer-events-none disabled:cursor-not-allowed bg-bg-surface border-border-default focus-visible:border-border-focused aria-invalid:border-border-error aria-invalid:ring-ring-error disabled:bg-bg-surface-tertiary disabled:text-text-disabled disabled:border-border-disabled",
  {
    variants: {
      variant: {
        default: "",
        labeled: ""
      },
      size: {
        lg: "h-14 px-4 py-4 text-typo-body-md",
        md: "h-12 px-4 py-3 text-typo-body-md",
        sm: "h-9 px-3 py-2 text-typo-body-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);
var Input = React2.forwardRef(
  (_a, ref) => {
    var _b = _a, {
      className,
      type,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      rightIconAriaLabel,
      onRightIconClick,
      variant,
      size,
      as = "input",
      textareaProps,
      required
    } = _b, props = __objRest(_b, [
      "className",
      "type",
      "label",
      "helperText",
      "error",
      "leftIcon",
      "rightIcon",
      "rightIconAriaLabel",
      "onRightIconClick",
      "variant",
      "size",
      "as",
      "textareaProps",
      "required"
    ]);
    const isTextarea = as === "textarea";
    const hasLeftIcon = Boolean(leftIcon);
    const hasRightIcon = Boolean(rightIcon);
    const ariaInvalid = error ? true : props["aria-invalid"];
    const textareaValue = props.value;
    const textareaOnChange = props.onChange;
    const textareaPlaceholder = props.placeholder;
    const textareaName = props.name;
    const textareaDisabled = props.disabled;
    const textareaReadOnly = props.readOnly;
    const controlClass = cn(
      inputVariants({ variant, size }),
      hasLeftIcon && "pl-10",
      hasRightIcon && "pr-10",
      className
    );
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex w-full flex-col gap-2", children: [
      label ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "text-xs font-semibold text-text-secondary", children: [
        label,
        required ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-text-error", children: " *" }) : null
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "relative", children: [
        hasLeftIcon ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-icon-secondary", children: leftIcon }) : null,
        isTextarea ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "textarea",
          __spreadValues({
            ref,
            className: cn(controlClass, "min-h-[120px] resize-y"),
            "aria-invalid": ariaInvalid,
            name: textareaName,
            placeholder: textareaPlaceholder,
            value: textareaValue,
            onChange: textareaOnChange,
            disabled: textareaDisabled,
            readOnly: textareaReadOnly,
            required
          }, textareaProps)
        ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          __spreadValues({
            ref,
            type,
            className: controlClass,
            "aria-invalid": ariaInvalid,
            required
          }, props)
        ),
        hasRightIcon ? onRightIconClick ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            onClick: onRightIconClick,
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-icon-secondary",
            "aria-label": rightIconAriaLabel != null ? rightIconAriaLabel : "input action",
            children: rightIcon
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-icon-secondary", children: rightIcon }) : null
      ] }),
      helperText ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "p",
        {
          className: cn(
            "text-xs",
            error ? "text-text-error" : "text-text-secondary"
          ),
          children: helperText
        }
      ) : null
    ] });
  }
);
Input.displayName = "Input";

// components/ui/toggle.tsx
var React3 = __toESM(require("react"));
var import_class_variance_authority3 = require("class-variance-authority");
var import_jsx_runtime3 = require("react/jsx-runtime");
var toggleVariants = (0, import_class_variance_authority3.cva)(
  "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-bg-toggle-off hover:bg-bg-toggle-off-hovered data-[state=checked]:bg-bg-toggle-on data-[state=checked]:hover:bg-bg-toggle-on-hovered disabled:bg-bg-surface-tertiary disabled:data-[state=checked]:bg-bg-tertiary-pressed",
        subtle: "bg-bg-toggle-off hover:bg-bg-toggle-off-hovered data-[state=checked]:bg-bg-toggle-subtle-on data-[state=checked]:hover:bg-bg-toggle-subtle-on-hovered disabled:bg-bg-surface-tertiary disabled:data-[state=checked]:bg-border-default"
      },
      size: {
        lg: "h-8 w-[52px]",
        md: "h-6 w-11",
        sm: "h-5 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);
var thumbSize = {
  lg: "h-7 w-7",
  md: "h-5 w-5",
  sm: "h-4 w-4"
};
var thumbTranslate = {
  lg: "translate-x-5",
  md: "translate-x-5",
  sm: "translate-x-4"
};
var Toggle = React3.forwardRef(
  (_a, ref) => {
    var _b = _a, {
      className,
      variant,
      size,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      label,
      description,
      labelPosition = "left",
      disabled
    } = _b, props = __objRest(_b, [
      "className",
      "variant",
      "size",
      "checked",
      "defaultChecked",
      "onCheckedChange",
      "label",
      "description",
      "labelPosition",
      "disabled"
    ]);
    const [internalChecked, setInternalChecked] = React3.useState(defaultChecked);
    const isControlled = controlledChecked !== void 0;
    const isChecked = isControlled ? controlledChecked : internalChecked;
    const resolvedSize = size != null ? size : "md";
    const handleClick = () => {
      if (disabled) return;
      const next = !isChecked;
      if (!isControlled) setInternalChecked(next);
      onCheckedChange == null ? void 0 : onCheckedChange(next);
    };
    const switchEl = /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "button",
      __spreadProps(__spreadValues({
        ref,
        type: "button",
        role: "switch",
        "aria-checked": isChecked,
        "aria-label": !label ? props["aria-label"] : void 0,
        "data-state": isChecked ? "checked" : "unchecked",
        disabled,
        className: cn(toggleVariants({ variant, size, className: label ? void 0 : className })),
        onClick: handleClick
      }, props), {
        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "span",
          {
            className: cn(
              "pointer-events-none block rounded-full bg-bg-toggle-thumb shadow-sm transition-transform duration-200 ease-in-out translate-x-0.5",
              thumbSize[resolvedSize],
              isChecked && thumbTranslate[resolvedSize],
              disabled && !isChecked && "bg-bg-surface-secondary",
              disabled && isChecked && (variant === "subtle" ? "bg-bg-surface-tertiary" : "bg-bg-tertiary")
            )
          }
        )
      })
    );
    if (!label) return switchEl;
    const labelEl = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-typo-label-md font-semibold text-text-primary", children: label }),
      description ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "mt-0.5 text-typo-body-sm text-text-secondary", children: description }) : null
    ] });
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "label",
      {
        className: cn(
          "flex items-center gap-3",
          disabled && "opacity-50 cursor-not-allowed",
          className
        ),
        children: labelPosition === "left" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          labelEl,
          switchEl
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          switchEl,
          labelEl
        ] })
      }
    );
  }
);
Toggle.displayName = "Toggle";

// components/ui/select.tsx
var React4 = __toESM(require("react"));
var import_class_variance_authority4 = require("class-variance-authority");
var import_lucide_react = require("lucide-react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var selectVariants = (0, import_class_variance_authority4.cva)(
  "w-full min-w-0 appearance-none rounded-full border bg-bg-surface border-border-default text-text-primary placeholder:text-text-disabled transition-[border-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:border-border-focused aria-invalid:border-border-error aria-invalid:ring-ring-error disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-bg-surface-tertiary disabled:text-text-disabled disabled:border-border-disabled",
  {
    variants: {
      size: {
        lg: "h-14 px-4 pr-10 text-typo-body-md",
        md: "h-12 px-4 pr-10 text-typo-body-md",
        sm: "h-9 px-3 pr-8 text-typo-body-sm"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
var Select = React4.forwardRef(
  (_a, ref) => {
    var _b = _a, {
      className,
      size,
      variant = "default",
      label,
      helperText,
      error,
      placeholder,
      required,
      children,
      value,
      defaultValue
    } = _b, props = __objRest(_b, [
      "className",
      "size",
      "variant",
      "label",
      "helperText",
      "error",
      "placeholder",
      "required",
      "children",
      "value",
      "defaultValue"
    ]);
    const ariaInvalid = error ? true : props["aria-invalid"];
    const resolvedSize = size != null ? size : "md";
    const iconSize = resolvedSize === "sm" ? "h-4 w-4" : "h-5 w-5";
    const hasValue = value !== void 0 ? value !== "" : defaultValue !== void 0 ? defaultValue !== "" : false;
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex w-full flex-col gap-2", children: [
      variant === "labeled" && label ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "text-xs font-semibold text-text-secondary", children: [
        label,
        required ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-text-error", children: " *" }) : null
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "relative", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "select",
          __spreadProps(__spreadValues({
            ref,
            className: cn(
              selectVariants({ size }),
              !hasValue && !value && "text-text-tertiary",
              className
            ),
            "aria-invalid": ariaInvalid,
            required,
            value,
            defaultValue
          }, props), {
            children: [
              placeholder ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "", disabled: true, hidden: true, children: placeholder }) : null,
              children
            ]
          })
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          import_lucide_react.ChevronDown,
          {
            className: cn(
              "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-icon-secondary",
              iconSize
            )
          }
        )
      ] }),
      helperText ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "p",
        {
          className: cn(
            "text-xs",
            error ? "text-text-error" : "text-text-secondary"
          ),
          children: helperText
        }
      ) : null
    ] });
  }
);
Select.displayName = "Select";

// components/ui/tab.tsx
var React5 = __toESM(require("react"));
var import_class_variance_authority5 = require("class-variance-authority");
var import_jsx_runtime5 = require("react/jsx-runtime");
var TabsContext = React5.createContext(null);
var tabItemVariants = (0, import_class_variance_authority5.cva)(
  "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:text-text-tertiary active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        underline: "bg-transparent text-text-secondary hover:text-text-primary data-[active=true]:text-text-primary data-[active=true]:after:absolute data-[active=true]:after:bottom-0 data-[active=true]:after:left-0 data-[active=true]:after:right-0 data-[active=true]:after:h-0.5 data-[active=true]:after:bg-bg-primary data-[active=true]:after:rounded-full",
        pill: "rounded-full bg-transparent text-text-secondary hover:bg-bg-surface-secondary hover:text-text-primary data-[active=true]:bg-bg-primary data-[active=true]:text-text-on-primary"
      },
      size: {
        lg: "h-12 px-4 text-typo-label-lg",
        md: "h-10 px-3 text-typo-label-md",
        sm: "h-8 px-2 text-typo-label-sm"
      }
    },
    compoundVariants: [
      { size: "lg", className: "[&_svg]:size-5" },
      { size: "md", className: "[&_svg]:size-4" },
      { size: "sm", className: "[&_svg]:h-3.5 [&_svg]:w-3.5" }
    ],
    defaultVariants: {
      variant: "underline",
      size: "md"
    }
  }
);
var Tabs = React5.forwardRef(
  (_a, ref) => {
    var _b = _a, {
      className,
      variant = "underline",
      size = "md",
      fullWidth,
      children
    } = _b, props = __objRest(_b, [
      "className",
      "variant",
      "size",
      "fullWidth",
      "children"
    ]);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(TabsContext.Provider, { value: { variant, size }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "div",
      __spreadProps(__spreadValues({
        ref,
        role: "tablist",
        className: cn(
          "flex items-center gap-1 overflow-x-auto scrollbar-hide",
          variant === "underline" && "border-b border-border-default gap-0",
          fullWidth && "[&>*]:flex-1",
          className
        )
      }, props), {
        children
      })
    ) });
  }
);
Tabs.displayName = "Tabs";
var TabItem = React5.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, active, leftIcon, badge, children } = _b, props = __objRest(_b, ["className", "active", "leftIcon", "badge", "children"]);
    var _a2, _b2;
    const context = React5.useContext(TabsContext);
    const variant = (_a2 = context == null ? void 0 : context.variant) != null ? _a2 : "underline";
    const size = (_b2 = context == null ? void 0 : context.size) != null ? _b2 : "md";
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "button",
      __spreadProps(__spreadValues({
        ref,
        role: "tab",
        "aria-selected": active,
        "data-active": active,
        className: cn(tabItemVariants({ variant, size, className }))
      }, props), {
        children: [
          leftIcon,
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children }),
          badge != null && badge > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-bg-negative px-1 text-typo-label-sm font-medium text-text-on-negative", children: badge > 99 ? "99+" : badge }) : null
        ]
      })
    );
  }
);
TabItem.displayName = "TabItem";

// components/ui/chip.tsx
var React6 = __toESM(require("react"));
var import_class_variance_authority6 = require("class-variance-authority");
var import_lucide_react2 = require("lucide-react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var chipVariants = (0, import_class_variance_authority6.cva)(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        /** 선택된 필터, 활성 상태 */
        solid: "bg-bg-primary text-text-on-primary hover:bg-bg-primary-hovered active:bg-bg-primary-pressed disabled:bg-bg-primary-disabled disabled:text-text-on-primary-disabled",
        /** 기본 필터 칩. 앞에 이모지/아이콘, 뒤에 화살표 조합 가능 */
        outlined: "border border-border-default bg-transparent text-text-secondary hover:bg-bg-surface-secondary active:bg-bg-surface-tertiary disabled:text-text-tertiary disabled:border-border-disabled"
      },
      size: {
        md: "h-8 px-3 text-[14px] font-semibold",
        sm: "h-6 px-2 text-[12px] font-medium"
      }
    },
    compoundVariants: [
      { size: "md", className: "[&_svg]:h-3.5 [&_svg]:w-3.5" },
      { size: "sm", className: "[&_svg]:h-3 [&_svg]:w-3" }
    ],
    defaultVariants: {
      variant: "outlined",
      size: "md"
    }
  }
);
var Chip = React6.forwardRef(
  (_a, ref) => {
    var _b = _a, {
      className,
      variant,
      size,
      leftIcon,
      rightIcon,
      removable,
      onRemove,
      children
    } = _b, props = __objRest(_b, [
      "className",
      "variant",
      "size",
      "leftIcon",
      "rightIcon",
      "removable",
      "onRemove",
      "children"
    ]);
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "button",
      __spreadProps(__spreadValues({
        ref,
        className: cn(chipVariants({ variant, size, className }))
      }, props), {
        children: [
          leftIcon,
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children }),
          rightIcon,
          removable ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "span",
            {
              role: "button",
              tabIndex: -1,
              onClick: (e) => {
                e.stopPropagation();
                onRemove == null ? void 0 : onRemove(e);
              },
              className: "ml-0.5 rounded-full opacity-70 hover:opacity-100",
              children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_lucide_react2.X, {})
            }
          ) : null
        ]
      })
    );
  }
);
Chip.displayName = "Chip";

// components/ui/badge.tsx
var React7 = __toESM(require("react"));
var import_class_variance_authority7 = require("class-variance-authority");
var import_jsx_runtime7 = require("react/jsx-runtime");
var badgeVariants = (0, import_class_variance_authority7.cva)(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-[background-color,border-color,color]",
  {
    variants: {
      variant: {
        solid: "",
        soft: "",
        outline: "border"
      },
      tone: {
        neutral: "",
        brand: "",
        success: "",
        warning: "",
        error: ""
      },
      size: {
        md: "h-6 px-2 text-[12px]",
        sm: "h-5 px-1.5 text-[12px]",
        xs: "h-4 px-1.5 text-[10px]"
      },
      dot: {
        true: "h-2 w-2 p-0",
        false: ""
      }
    },
    compoundVariants: [
      { variant: "soft", tone: "neutral", className: "bg-bg-surface-secondary text-text-secondary" },
      { variant: "soft", tone: "brand", className: "bg-bg-info text-text-on-tertiary" },
      { variant: "soft", tone: "success", className: "bg-bg-success text-text-success" },
      { variant: "soft", tone: "warning", className: "bg-bg-warning text-text-warning" },
      { variant: "soft", tone: "error", className: "bg-bg-error text-text-error" },
      { variant: "solid", tone: "neutral", className: "bg-bg-badge-neutral text-text-badge-neutral" },
      { variant: "solid", tone: "brand", className: "bg-bg-primary text-text-on-primary" },
      { variant: "solid", tone: "success", className: "bg-bg-success-solid text-text-on-primary" },
      { variant: "solid", tone: "warning", className: "bg-bg-warning-solid text-text-primary" },
      { variant: "solid", tone: "error", className: "bg-bg-negative text-text-on-negative" },
      { variant: "outline", tone: "neutral", className: "border-border-default text-text-secondary" },
      { variant: "outline", tone: "brand", className: "border-border-outlined text-text-on-tertiary" },
      { variant: "outline", tone: "success", className: "border-border-success text-text-success" },
      { variant: "outline", tone: "warning", className: "border-border-warning text-text-warning" },
      { variant: "outline", tone: "error", className: "border-border-error text-text-error" }
    ],
    defaultVariants: {
      variant: "soft",
      tone: "neutral",
      size: "md",
      dot: false
    }
  }
);
var Badge = React7.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, variant, tone, size, dot, leftIcon, children } = _b, props = __objRest(_b, ["className", "variant", "tone", "size", "dot", "leftIcon", "children"]);
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "span",
      __spreadProps(__spreadValues({
        ref,
        className: cn(badgeVariants({ variant, tone, size, dot, className }))
      }, props), {
        children: [
          dot ? null : leftIcon,
          dot ? null : children
        ]
      })
    );
  }
);
Badge.displayName = "Badge";

// components/ui/divider.tsx
var React8 = __toESM(require("react"));
var import_class_variance_authority8 = require("class-variance-authority");
var import_jsx_runtime8 = require("react/jsx-runtime");
var dividerVariants = (0, import_class_variance_authority8.cva)("shrink-0", {
  variants: {
    orientation: {
      horizontal: "w-full",
      vertical: "h-full"
    },
    variant: {
      default: "bg-border-default",
      subtle: "bg-border-subtle",
      strong: "bg-bg-surface-secondary"
    }
  },
  defaultVariants: {
    orientation: "horizontal",
    variant: "default"
  },
  compoundVariants: [
    { orientation: "horizontal", variant: "default", className: "h-px" },
    { orientation: "horizontal", variant: "subtle", className: "h-px" },
    { orientation: "horizontal", variant: "strong", className: "h-2" },
    { orientation: "vertical", variant: "default", className: "w-px" },
    { orientation: "vertical", variant: "subtle", className: "w-px" },
    { orientation: "vertical", variant: "strong", className: "w-2" }
  ]
});
var Divider = React8.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, orientation, variant, inset } = _b, props = __objRest(_b, ["className", "orientation", "variant", "inset"]);
    const resolvedOrientation = orientation != null ? orientation : "horizontal";
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      "div",
      __spreadValues({
        ref,
        role: "separator",
        "aria-orientation": resolvedOrientation,
        className: cn(
          dividerVariants({ orientation: resolvedOrientation, variant, className })
        ),
        style: inset ? { marginLeft: inset } : void 0
      }, props)
    );
  }
);
Divider.displayName = "Divider";
var SectionHeader = React8.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, title, subtitle, action } = _b, props = __objRest(_b, ["className", "title", "subtitle", "action"]);
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
      "div",
      __spreadProps(__spreadValues({
        ref,
        className: cn("flex items-start justify-between gap-3", className)
      }, props), {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-typo-body-md font-semibold text-text-primary", children: title }),
            subtitle ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-typo-body-sm text-text-secondary", children: subtitle }) : null
          ] }),
          action ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "shrink-0", children: action }) : null
        ]
      })
    );
  }
);
SectionHeader.displayName = "SectionHeader";

// components/ui/list.tsx
var React9 = __toESM(require("react"));
var import_class_variance_authority9 = require("class-variance-authority");
var import_jsx_runtime9 = require("react/jsx-runtime");
var ListContext = React9.createContext(null);
var listItemVariants = (0, import_class_variance_authority9.cva)(
  "relative flex w-full items-center gap-3 text-left transition-[background-color,transform] active:scale-[0.99] bg-transparent hover:bg-bg-surface-secondary active:bg-bg-surface-tertiary",
  {
    variants: {
      size: {
        lg: "min-h-16 px-4 py-4",
        md: "min-h-14 px-4 py-3",
        sm: "min-h-11 px-3 py-2"
      },
      selected: {
        true: "bg-bg-tertiary before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-bg-primary",
        false: ""
      },
      disabled: {
        true: "pointer-events-none bg-bg-surface-tertiary text-text-tertiary",
        false: ""
      }
    },
    defaultVariants: {
      size: "md",
      selected: false,
      disabled: false
    }
  }
);
var List = React9.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, size = "md", divided = true } = _b, props = __objRest(_b, ["className", "size", "divided"]);
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ListContext.Provider, { value: { size }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "div",
      __spreadValues({
        ref,
        className: cn(
          "flex flex-col",
          divided && "divide-y divide-border-subtle",
          className
        )
      }, props)
    ) });
  }
);
List.displayName = "List";
var ListItem = React9.forwardRef(
  (_a, ref) => {
    var _b = _a, {
      className,
      size,
      selected,
      disabled,
      title,
      subtitle,
      leading,
      trailing
    } = _b, props = __objRest(_b, [
      "className",
      "size",
      "selected",
      "disabled",
      "title",
      "subtitle",
      "leading",
      "trailing"
    ]);
    var _a2;
    const context = React9.useContext(ListContext);
    const resolvedSize = (_a2 = size != null ? size : context == null ? void 0 : context.size) != null ? _a2 : "md";
    const isButton = Boolean(props.onClick) && !disabled;
    const renderLeading = () => {
      if (!leading) return null;
      const isInput = React9.isValidElement(leading) && leading.type === "input";
      if (isInput) return leading;
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bg-surface-secondary [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-icon-secondary", children: leading });
    };
    const renderTrailing = () => {
      if (!trailing) return null;
      if (React9.isValidElement(trailing)) return trailing;
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[14px] text-text-secondary", children: trailing });
    };
    const content = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      renderLeading(),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex-1", children: [
        title ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[16px] font-medium text-text-primary", children: title }) : null,
        subtitle ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-[14px] text-text-secondary", children: subtitle }) : null
      ] }),
      renderTrailing()
    ] });
    const cls = cn(listItemVariants({ size: resolvedSize, selected, disabled }), className);
    if (isButton) {
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", __spreadProps(__spreadValues({ ref, className: cls, disabled: Boolean(disabled) }, props), { children: content }));
    }
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: cls, children: content });
  }
);
ListItem.displayName = "ListItem";

// components/ui/card.tsx
var React10 = __toESM(require("react"));
var import_jsx_runtime10 = require("react/jsx-runtime");
var Card = React10.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, fit = "fill", children } = _b, props = __objRest(_b, ["className", "fit", "children"]);
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "div",
      __spreadProps(__spreadValues({
        ref,
        className: cn(
          "bg-bg-surface-secondary rounded-xl p-5 text-text-primary flex flex-col gap-[10px]",
          fit === "hug" ? "w-fit" : "w-full",
          className
        )
      }, props), {
        children
      })
    );
  }
);
Card.displayName = "Card";
var CardHeader = React10.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, title, subtitle, action, children } = _b, props = __objRest(_b, ["className", "title", "subtitle", "action", "children"]);
    if (children) {
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", __spreadProps(__spreadValues({ ref, className: cn("flex items-start gap-3", className) }, props), { children }));
    }
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", __spreadProps(__spreadValues({ ref, className: cn("flex items-start gap-3", className) }, props), { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex-1 flex flex-col gap-[4px]", children: [
        title && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-[16px] font-bold text-text-primary", children: title }),
        subtitle && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-[14px] text-text-primary", children: subtitle })
      ] }),
      action && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "shrink-0", children: action })
    ] }));
  }
);
CardHeader.displayName = "CardHeader";
var CardBody = React10.forwardRef(
  (_a, ref) => {
    var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "div",
      __spreadValues({
        ref,
        className: cn("text-[14px] text-text-primary flex flex-col gap-[4px]", className)
      }, props)
    );
  }
);
CardBody.displayName = "CardBody";
var CardFooter = React10.forwardRef(
  (_a, ref) => {
    var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "div",
      __spreadValues({
        ref,
        className: cn("flex items-center justify-end gap-2 border-t border-border-subtle pt-3", className)
      }, props)
    );
  }
);
CardFooter.displayName = "CardFooter";
var CardImage = React10.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, alt } = _b, props = __objRest(_b, ["className", "alt"]);
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "img",
      __spreadValues({
        ref,
        alt,
        className: cn("aspect-video w-full object-cover", className)
      }, props)
    );
  }
);
CardImage.displayName = "CardImage";

// components/ui/header.tsx
var React11 = __toESM(require("react"));
var import_jsx_runtime11 = require("react/jsx-runtime");
var AppBar = React11.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, depth, title, left, right, sticky } = _b, props = __objRest(_b, ["className", "depth", "title", "left", "right", "sticky"]);
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
      "header",
      __spreadProps(__spreadValues({
        ref,
        className: cn(
          "flex w-full items-center justify-between px-5 h-14 bg-bg-surface border-b border-border-default text-text-primary",
          sticky && "sticky top-0 z-20",
          className
        )
      }, props), {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "flex min-w-0 items-center gap-2", children: left }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "min-w-0 flex-1 text-center", children: title ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "truncate text-[16px] font-semibold", children: title }) : null }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "flex min-w-0 items-center justify-end gap-2", children: right })
        ]
      })
    );
  }
);
AppBar.displayName = "AppBar";

// components/ui/bottom-nav.tsx
var React12 = __toESM(require("react"));
var import_class_variance_authority10 = require("class-variance-authority");
var import_jsx_runtime12 = require("react/jsx-runtime");
var bottomNavVariants = (0, import_class_variance_authority10.cva)(
  "flex w-full items-center justify-around rounded-full px-3 pb-[env(safe-area-inset-bottom)]",
  {
    variants: {
      variant: {
        default: "bg-bg-surface border border-border-default",
        elevated: "bg-white/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
      },
      fixed: {
        true: "fixed bottom-3 left-5 right-5 z-30",
        false: ""
      },
      size: {
        md: "h-16",
        lg: "h-20"
      }
    },
    defaultVariants: {
      variant: "elevated",
      fixed: true,
      size: "md"
    }
  }
);
var BottomNav = React12.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, variant, fixed, size } = _b, props = __objRest(_b, ["className", "variant", "fixed", "size"]);
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      "nav",
      __spreadValues({
        ref,
        className: cn(bottomNavVariants({ variant, fixed, size, className }))
      }, props)
    );
  }
);
BottomNav.displayName = "BottomNav";
var bottomNavItemVariants = (0, import_class_variance_authority10.cva)(
  "relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-full px-3 text-[10px] transition-all duration-200 active:scale-[0.95]",
  {
    variants: {
      active: {
        true: "text-blue-500 font-semibold [&_svg]:stroke-[2.5px] bg-gray-100",
        false: "text-gray-400 font-normal [&_svg]:stroke-[1.5px]"
      }
    },
    defaultVariants: {
      active: false
    }
  }
);
var BottomNavItem = React12.forwardRef(
  (_a, ref) => {
    var _b = _a, { className, active, icon, badge, label, children } = _b, props = __objRest(_b, ["className", "active", "icon", "badge", "label", "children"]);
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
      "button",
      __spreadProps(__spreadValues({
        ref,
        className: cn(bottomNavItemVariants({ active, className }))
      }, props), {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: "relative [&_svg]:h-5 [&_svg]:w-5", children: [
            icon,
            badge != null && badge > 0 ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "absolute -right-2 -top-2 inline-flex min-w-[16px] items-center justify-center rounded-full bg-bg-negative px-1 text-typo-label-sm font-semibold text-text-on-negative", children: badge > 99 ? "99+" : badge }) : null
          ] }),
          label ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: label }) : children
        ]
      })
    );
  }
);
BottomNavItem.displayName = "BottomNavItem";

// components/ui/bottom-nav-with-search.tsx
var React13 = __toESM(require("react"));
var import_lucide_react3 = require("lucide-react");
var import_jsx_runtime13 = require("react/jsx-runtime");
var PILL = "bg-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl";
var T = "width 320ms cubic-bezier(0.4,0,0.2,1), height 320ms cubic-bezier(0.4,0,0.2,1)";
var BottomNavWithSearch = React13.forwardRef(
  (_a, ref) => {
    var _b = _a, {
      className,
      items,
      searchPlaceholder = "\uC9C0\uC5ED, \uAD6C\uC7A5, \uD300 \uC774\uB984\uC73C\uB85C \uCC3E\uAE30",
      fixed = true,
      defaultSearchOpen = false,
      onSearchFocus,
      onSearchBlur,
      onSearchChange,
      onSearchSubmit,
      onSearchClose
    } = _b, props = __objRest(_b, [
      "className",
      "items",
      "searchPlaceholder",
      "fixed",
      "defaultSearchOpen",
      "onSearchFocus",
      "onSearchBlur",
      "onSearchChange",
      "onSearchSubmit",
      "onSearchClose"
    ]);
    const [searching, setSearching] = React13.useState(defaultSearchOpen);
    const [searchValue, setSearchValue] = React13.useState("");
    const inputRef = React13.useRef(null);
    const activeIndex = Math.max(items.findIndex((item) => item.active), 0);
    const activeItem = items[activeIndex];
    const handleSearchClick = () => {
      setSearching(true);
      onSearchFocus == null ? void 0 : onSearchFocus();
      setTimeout(() => {
        var _a2;
        return (_a2 = inputRef.current) == null ? void 0 : _a2.focus();
      }, 320);
    };
    const handleClose = () => {
      setSearching(false);
      setSearchValue("");
      onSearchBlur == null ? void 0 : onSearchBlur();
      onSearchChange == null ? void 0 : onSearchChange("");
      onSearchClose == null ? void 0 : onSearchClose();
    };
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
      "div",
      __spreadProps(__spreadValues({
        ref,
        className: cn(
          "flex items-center gap-2 h-[62px]",
          fixed ? "fixed bottom-3 left-5 right-5 z-30" : "relative w-full",
          className
        )
      }, props), {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
            "div",
            {
              className: cn("relative flex-none overflow-hidden rounded-full", PILL),
              style: {
                width: searching ? "48px" : "calc(100% - 72px)",
                height: searching ? "48px" : "62px",
                transition: T
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                  "div",
                  {
                    className: "absolute inset-0 flex items-stretch px-1",
                    style: {
                      opacity: searching ? 0 : 1,
                      pointerEvents: searching ? "none" : "auto",
                      transition: "opacity 180ms ease-out"
                    },
                    children: items.map((item, i) => {
                      var _a2;
                      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                        "div",
                        {
                          className: "flex flex-1 items-stretch p-[2px]",
                          children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(BottomNavItem, __spreadValues({}, item))
                        },
                        (_a2 = item.label) != null ? _a2 : i
                      );
                    })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                  "div",
                  {
                    className: "absolute inset-0 flex items-center justify-center",
                    style: {
                      opacity: searching ? 1 : 0,
                      pointerEvents: searching ? "auto" : "none",
                      transition: "opacity 180ms ease-out"
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                      BottomNavItem,
                      __spreadProps(__spreadValues({}, activeItem), {
                        label: void 0,
                        active: false,
                        onClick: (e) => {
                          var _a2;
                          handleClose();
                          (_a2 = activeItem.onClick) == null ? void 0 : _a2.call(activeItem, e);
                        }
                      })
                    )
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
            "div",
            {
              className: cn(
                "flex-none self-center overflow-hidden rounded-full flex items-center",
                PILL
              ),
              style: {
                width: searching ? "calc(100% - 56px)" : "64px",
                height: searching ? "48px" : "62px",
                transition: T
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: searching ? () => {
                      var _a2;
                      return (_a2 = inputRef.current) == null ? void 0 : _a2.focus();
                    } : handleSearchClick,
                    className: "h-full w-[64px] shrink-0 flex items-center justify-center text-gray-400",
                    children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_lucide_react3.Search, { className: "h-6 w-6 stroke-[1.5]" })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
                  "input",
                  {
                    ref: inputRef,
                    type: "text",
                    value: searchValue,
                    onChange: (e) => {
                      setSearchValue(e.target.value);
                      onSearchChange == null ? void 0 : onSearchChange(e.target.value);
                    },
                    onKeyDown: (e) => {
                      if (e.key === "Escape") handleClose();
                      if (e.key === "Enter" && searchValue.trim()) onSearchSubmit == null ? void 0 : onSearchSubmit(searchValue.trim());
                    },
                    placeholder: searchPlaceholder,
                    className: "flex-1 min-w-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none pr-4"
                  }
                )
              ]
            }
          )
        ]
      })
    );
  }
);
BottomNavWithSearch.displayName = "BottomNavWithSearch";

// components/ui/bottom-sheet.tsx
var React14 = __toESM(require("react"));
var import_class_variance_authority11 = require("class-variance-authority");
var import_lucide_react4 = require("lucide-react");
var import_jsx_runtime14 = require("react/jsx-runtime");
var sheetVariants = (0, import_class_variance_authority11.cva)(
  "fixed inset-x-0 bottom-0 z-50 w-full rounded-t-2xl"
);
var surfaceClasses = {
  L2: "bg-bg-surface-secondary shadow-[var(--shadow-level-2)]",
  L3: "bg-bg-surface shadow-[var(--shadow-level-3)]",
  L4: "bg-bg-surface shadow-[var(--shadow-level-4)]"
};
var BottomSheet = React14.forwardRef(
  (_a, ref) => {
    var _b = _a, {
      open,
      onOpenChange,
      surface = "L3",
      title,
      description,
      footer,
      maxHeight = "70vh",
      showClose = true,
      showHandle = true,
      className,
      children,
      contentClassName
    } = _b, props = __objRest(_b, [
      "open",
      "onOpenChange",
      "surface",
      "title",
      "description",
      "footer",
      "maxHeight",
      "showClose",
      "showHandle",
      "className",
      "children",
      "contentClassName"
    ]);
    if (!open) return null;
    const resolvedMaxHeight = maxHeight;
    const surfaceClass = surfaceClasses[surface];
    const localRef = React14.useRef(null);
    const setRefs = (node) => {
      localRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    React14.useEffect(() => {
      const container = localRef.current;
      if (!container) return;
      const previousActive = document.activeElement;
      const focusable = container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first) first.focus();
      const handleKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onOpenChange(false);
          return;
        }
        if (event.key !== "Tab") return;
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      container.addEventListener("keydown", handleKeyDown);
      return () => {
        container.removeEventListener("keydown", handleKeyDown);
        previousActive == null ? void 0 : previousActive.focus();
      };
    }, [open]);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "fixed inset-0 z-40", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        "div",
        {
          className: "absolute inset-0 bg-scrim-default",
          onClick: () => onOpenChange(false)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(
        "div",
        __spreadProps(__spreadValues({
          ref: setRefs,
          role: "dialog",
          "aria-modal": "true",
          className: cn(sheetVariants({ className }), surfaceClass),
          style: { maxHeight: resolvedMaxHeight },
          onClick: (e) => e.stopPropagation()
        }, props), {
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "px-5 pt-4", children: [
              showHandle ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "mx-auto mb-3 h-1 w-9 rounded-full bg-border-default" }) : null,
              title || showClose ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "flex items-start justify-between gap-3", children: [
                /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "flex-1", children: [
                  title ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "text-[16px] font-bold text-text-primary", children: title }) : null,
                  description ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: "mt-1 text-[14px] text-text-secondary", children: description }) : null
                ] }),
                showClose ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: () => onOpenChange(false),
                    className: "rounded-full p-1 text-icon-secondary hover:bg-bg-surface-tertiary",
                    "aria-label": "\uB2EB\uAE30",
                    children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_lucide_react4.X, { className: "h-4 w-4" })
                  }
                ) : null
              ] }) : null
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
              "div",
              {
                className: cn(
                  "mt-4 overflow-y-auto px-5 pb-5 text-[14px] text-text-primary",
                  contentClassName
                ),
                style: { maxHeight: `calc(${resolvedMaxHeight} - 96px)` },
                children
              }
            ),
            footer ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "border-t border-border-subtle px-5 py-4", children: footer }) : null
          ]
        })
      )
    ] });
  }
);
BottomSheet.displayName = "BottomSheet";

// components/ui/full-modal.tsx
var React15 = __toESM(require("react"));
var import_class_variance_authority12 = require("class-variance-authority");
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime15 = require("react/jsx-runtime");
var modalVariants = (0, import_class_variance_authority12.cva)(
  "fixed inset-0 z-50 flex flex-col"
);
var surfaceClasses2 = {
  L3: "bg-bg-surface shadow-[var(--shadow-level-3)]",
  L4: "bg-bg-surface shadow-[var(--shadow-level-4)]"
};
var FullModal = React15.forwardRef(
  (_a, ref) => {
    var _b = _a, {
      open,
      onOpenChange,
      surface = "L3",
      title,
      description,
      footer,
      showClose = true,
      className,
      children
    } = _b, props = __objRest(_b, [
      "open",
      "onOpenChange",
      "surface",
      "title",
      "description",
      "footer",
      "showClose",
      "className",
      "children"
    ]);
    if (!open) return null;
    const surfaceClass = surfaceClasses2[surface];
    const localRef = React15.useRef(null);
    const setRefs = (node) => {
      localRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    React15.useEffect(() => {
      const container = localRef.current;
      if (!container) return;
      const previousActive = document.activeElement;
      const focusable = container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first) first.focus();
      const handleKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onOpenChange(false);
          return;
        }
        if (event.key !== "Tab") return;
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      container.addEventListener("keydown", handleKeyDown);
      return () => {
        container.removeEventListener("keydown", handleKeyDown);
        previousActive == null ? void 0 : previousActive.focus();
      };
    }, [open]);
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
      "div",
      __spreadProps(__spreadValues({
        ref: setRefs,
        role: "dialog",
        "aria-modal": "true",
        className: cn(modalVariants({ className }), surfaceClass)
      }, props), {
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex items-start justify-between gap-3 border-b border-border-default px-5 py-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "flex-1", children: [
              title ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "text-[16px] font-bold text-text-primary", children: title }) : null,
              description ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "mt-1 text-[14px] text-text-secondary", children: description }) : null
            ] }),
            showClose ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
              "button",
              {
                type: "button",
                onClick: () => onOpenChange(false),
                className: "rounded-full p-1 text-icon-secondary hover:bg-bg-surface-tertiary",
                "aria-label": "\uB2EB\uAE30",
                children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_lucide_react5.X, { className: "h-4 w-4" })
              }
            ) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "flex-1 overflow-y-auto px-5 pb-5 pt-4 text-[14px] text-text-primary", children }),
          footer ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "border-t border-border-default px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom))]", children: footer }) : null
        ]
      })
    );
  }
);
FullModal.displayName = "FullModal";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AppBar,
  Badge,
  BottomNav,
  BottomNavItem,
  BottomNavWithSearch,
  BottomSheet,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardImage,
  Chip,
  Divider,
  FullModal,
  Input,
  List,
  ListItem,
  SectionHeader,
  Select,
  TabItem,
  Tabs,
  Toggle,
  badgeVariants,
  bottomNavItemVariants,
  bottomNavVariants,
  buttonVariants,
  chipVariants,
  dividerVariants,
  inputVariants,
  listItemVariants,
  selectVariants,
  tabItemVariants,
  toggleVariants
});
