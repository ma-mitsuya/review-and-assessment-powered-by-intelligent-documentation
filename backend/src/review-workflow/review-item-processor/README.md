# Review Item Processor

This Lambda function processes review items using the Strands agent with MCP tools.

## Dependency Management

This project uses [uv](https://github.com/astral-sh/uv) for dependency management and locking.

### Installation

Install uv:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Using Dependency Locking

To install dependencies using the lockfile:

```bash
uv pip install -r requirements.txt
```

### Updating Dependencies

To update dependencies and regenerate the lockfile:

```bash
uv pip install --upgrade -r requirements.txt
```

### Adding New Dependencies

1. Add the new dependency to both `requirements.txt` and `pyproject.toml`
2. Run `uv pip install -r requirements.txt` to update the lockfile