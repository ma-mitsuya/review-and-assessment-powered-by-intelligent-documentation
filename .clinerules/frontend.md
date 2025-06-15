# Frontend Special Notes

## Basics

- vite React SPA
- tailwind
  - **Styling must always use frontend/tailwind.config.js**
    - Modification of frontend/tailwind.config.js is strictly forbidden
- Directory structure
  - Composed of pages, hooks, components, etc.
  - API fetching uses standard fetch
    - Must use useFetch
  - SWR is used
  - Items used commonly across the app like hooks can be placed at the src root, but basically adopt a feature-based approach
    - Create features/\* directories for each function, placing hooks, components, etc. under them
- Before implementation, check and understand the backend endpoints
  - Detailed in .clinerules/api_specs

## Language

- All TypeScript. JavaScript strictly forbidden
- CommonJS strictly forbidden. ES Modules (ESM) must be used at all times

## Core Component Usage

- When implementing, always attempt to use components under frontend/src/components
  - e.g., when using buttons. If insufficient, create inherited buttons under respective features/components
  - Especially avoid overusing the <button> tag. Always use components
- For alerts and confirmations:
  - Native `alert()` and `confirm()` methods are prohibited
  - Always use `useAlert` hook and `AlertModal` component
  - Usage example:

    ```tsx
    const { showAlert, showConfirm, showSuccess, showError, AlertModal } =
      useAlert();

    // Show alerts
    showAlert("Information message");
    showSuccess("Operation completed successfully");
    showError("An error occurred");

    // Show confirmation dialog
    showConfirm("Are you sure you want to delete this item?", {
      title: "Confirm Deletion",
      confirmButtonText: "Delete",
      onConfirm: () => handleDelete(),
      onCancel: () => console.log("Cancelled"),
    });

    // Don't forget to include the AlertModal component in your render
    return (
      <div>
        {/* Your component content */}
        <AlertModal />
      </div>
    );
    ```

## Icons

- SVG usage is prohibited, always use react-icons
