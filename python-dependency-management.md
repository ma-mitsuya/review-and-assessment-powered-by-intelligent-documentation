# Python Dependency Management

This project uses [uv](https://github.com/astral-sh/uv) for Python dependency management and locking. uv is a fast Python package installer and resolver written in Rust.

## Benefits of Using uv

- **Deterministic builds**: Lock files ensure consistent builds across environments.
- **Faster installation**: uv is significantly faster than pip.
- **Better dependency resolution**: Reduces conflicts and dependency hell.
- **Modern tooling**: Compatible with common Python packaging tools.

## Python Modules with Dependency Locking

The following Python modules use uv for dependency locking:

1. Review Item Processor (`/backend/src/review-workflow/review-item-processor/`)
2. MCP Runtime Python (`/cdk/lib/constructs/mcp-runtime/python/`)

## How to Use

For each module, the following files manage dependencies:

- `requirements.txt` - Lists required packages with minimum version constraints
- `pyproject.toml` - Defines project metadata and dependencies
- `uv.lock` - Lock file that pins exact versions of all dependencies
- `.uv/setup.cfg` - Configuration for uv
- `update_deps.sh` - Helper script to update dependencies

### Installation

To install uv:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Basic Commands

1. **Install dependencies using lockfile**:
   ```bash
   uv pip install -r requirements.txt
   ```

2. **Update all dependencies**:
   ```bash
   uv pip install --upgrade --upgrade-package '*' -r requirements.txt
   ```

3. **Add a new dependency**:
   ```bash
   uv pip install new-package
   ```
   Then add it to both `requirements.txt` and `pyproject.toml`.

## Best Practices

1. Always commit the `uv.lock` file to version control.
2. Update dependencies intentionally, not automatically.
3. Use consistent Python versions across development and deployment environments.
4. When adding new dependencies, update both `requirements.txt` and `pyproject.toml`.