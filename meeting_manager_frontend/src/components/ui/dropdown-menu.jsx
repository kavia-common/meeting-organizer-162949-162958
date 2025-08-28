import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

/**
 * PUBLIC_INTERFACE
 * Dropdown Menu primitives (Shadcn-inspired) built on Radix Dropdown Menu.
 *
 * Usage:
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild>
 *       <button>Open</button>
 *     </DropdownMenuTrigger>
 *     <DropdownMenuContent align="end">
 *       <DropdownMenuLabel>My Account</DropdownMenuLabel>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem onSelect={() => ...}>Profile</DropdownMenuItem>
 *       <DropdownMenuItem disabled>Billing</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */

// PUBLIC_INTERFACE
export const DropdownMenu = DropdownMenuPrimitive.Root;
// PUBLIC_INTERFACE
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
// PUBLIC_INTERFACE
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
// PUBLIC_INTERFACE
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
// PUBLIC_INTERFACE
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
// PUBLIC_INTERFACE
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/**
 * PUBLIC_INTERFACE
 * DropdownMenuContent
 * Radix Content wrapper with basic styling classes.
 */
export const DropdownMenuContent = React.forwardRef(function DropdownMenuContent(
  { className = '', sideOffset = 8, align = 'start', ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={['mm-dropdown__content', className].join(' ')}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

/**
 * PUBLIC_INTERFACE
 * DropdownMenuItem - interactive item.
 */
export const DropdownMenuItem = React.forwardRef(function DropdownMenuItem(
  { className = '', inset = false, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={[
        'mm-dropdown__item',
        inset ? 'mm-dropdown__item--inset' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
});

/**
 * PUBLIC_INTERFACE
 * DropdownMenuLabel - non-interactive label text.
 */
export const DropdownMenuLabel = React.forwardRef(function DropdownMenuLabel(
  { className = '', inset = false, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={[
        'mm-dropdown__label',
        inset ? 'mm-dropdown__item--inset' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
});

/**
 * PUBLIC_INTERFACE
 * DropdownMenuSeparator - visual separator.
 */
export const DropdownMenuSeparator = React.forwardRef(function DropdownMenuSeparator(
  { className = '', ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={['mm-dropdown__separator', className].join(' ')}
      {...props}
    />
  );
});

/**
 * PUBLIC_INTERFACE
 * Checkbox / Radio items (optional primitives for future use)
 */
export const DropdownMenuCheckboxItem = React.forwardRef(function DropdownMenuCheckboxItem(
  { className = '', children, checked, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={['mm-dropdown__item', className].join(' ')}
      checked={checked}
      {...props}
    >
      <span className="mm-dropdown__item__indicator">
        <DropdownMenuPrimitive.ItemIndicator>✔</DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

export const DropdownMenuRadioItem = React.forwardRef(function DropdownMenuRadioItem(
  { className = '', children, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={['mm-dropdown__item', className].join(' ')}
      {...props}
    >
      <span className="mm-dropdown__item__indicator">
        <DropdownMenuPrimitive.ItemIndicator>•</DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});

export const DropdownMenuSubTrigger = React.forwardRef(function DropdownMenuSubTrigger(
  { className = '', inset = false, children, ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={[
        'mm-dropdown__item',
        'mm-dropdown__sub-trigger',
        inset ? 'mm-dropdown__item--inset' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
      <span className="mm-dropdown__right">›</span>
    </DropdownMenuPrimitive.SubTrigger>
  );
});

export const DropdownMenuSubContent = React.forwardRef(function DropdownMenuSubContent(
  { className = '', ...props },
  ref
) {
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={['mm-dropdown__content', className].join(' ')}
      {...props}
    />
  );
});
