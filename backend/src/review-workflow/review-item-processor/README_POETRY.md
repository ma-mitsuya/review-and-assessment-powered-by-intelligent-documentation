# Using Poetry for Dependency Management

This directory uses [Poetry](https://python-poetry.org/) for Python dependency management. Poetry provides a more robust way to manage dependencies with proper version locking.

## Prerequisites

1. Install Poetry if you don't have it already:

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Verify the installation:

```bash
poetry --version
```

## Getting Started

1. Install dependencies:

```bash
# Navigate to this directory
cd backend/src/review-workflow/review-item-processor

# Install dependencies from poetry.lock
poetry install

# Install local wheel package
poetry run pip install ./run_mcp_servers_with_aws_lambda-0.2.1.post2.dev0+254672e-py3-none-any.whl
```

## Adding New Dependencies

To add a new dependency:

```bash
poetry add package-name
```

This will automatically update both the `pyproject.toml` and `poetry.lock` files.

## Running Scripts

To run commands within the poetry environment:

```bash
poetry run python your_script.py
```

Or you can spawn a shell within the poetry environment:

```bash
poetry shell
```

## Updating Dependencies

To update dependencies:

```bash
# Update all dependencies
poetry update

# Update specific dependencies
poetry update package-name

# Show outdated packages
poetry show --outdated
```

## Troubleshooting

If you encounter any issues with Poetry:

1. Ensure you're running the latest version:
```bash
poetry self update
```

2. Try clearing the Poetry cache:
```bash
poetry cache clear . --all
```