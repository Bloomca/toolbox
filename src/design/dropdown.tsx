import { createRef, onMount } from "veles";
import type { JSX } from "veles/jsx-runtime";

import "./dropdown.css";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DropdownProps = Omit<JSX.HTMLAttributes<HTMLSelectElement>, "children"> & {
  options: readonly DropdownOption[];
  placeholder: string;
  placeholderSelected?: boolean;
};

export function Dropdown({
  options,
  placeholder,
  placeholderSelected = false,
  ...props
}: DropdownProps) {
  const selectRef = createRef<HTMLSelectElement>();

  onMount(() => {
    if (placeholderSelected && selectRef.current) selectRef.current.value = "";
  });

  return (
    <span data-toolbox-dropdown="">
      <select ref={selectRef} {...props} data-toolbox-dropdown-select="">
        {[
          <option value="" disabled selected={placeholderSelected}>
            {placeholder}
          </option>,
          ...options.map((option) => (
            <option value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          )),
        ]}
      </select>
      <span data-toolbox-dropdown-arrow="" aria-hidden="true">
        ▾
      </span>
    </span>
  );
}
