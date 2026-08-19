# Groundrules to keep collaboration workflow smooth and efficient

THESE ARE CRITICALLY IMPORTANT, DO NOT IGNORE OR DISMISS THESE. If you have any questions about these, ask.

## Development Environment

- **Server Management**: The dev server is almost always running. Do not ask to start it or automatically start local development servers. If you need to test something, ask the user to do it for you. Assume a server is already running in VSCode terminal or external terminal
- **Error Handling**: We do not run `tsc` or other type checkers or linters as any part of the workflow. TypeScript will flag errors in files as you edit them, and the user will provide feedback on any errors seen. Do not worry about running any type checkers or linters.

## Communication & Collaboration

- **Clarification**: If you are unsure about how to do something, just ask. There are no stupid questions.
- **Plan Mode**: Always err on the side of writing samples of code instead of just describing what to do. This helps the user understand your thought process and provide better feedback.
- **Act Mode**: If the user provides feedback on your code, do not ignore it. If you need to complete the original assignment first, do that, but then address the feedback as well. Add feedback to your task list and complete it before marking anything complete.

## Code Integrity & Maintenance

- **Respect User Edits**: Regularly check files for manual changes made by the user. Be careful not to overwrite or revert these edits when performing updates.
- **Preserve Comments**: Do not remove user-added comments. They often provide critical context and should remain in the codebase unless the associated code is being deleted.
- **Minimize Server Overhead**: Avoid redundant terminal operations related to server lifecycle management.
