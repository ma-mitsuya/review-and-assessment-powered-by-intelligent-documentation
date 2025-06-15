"""
Review Item Processor with MCP integration

This module provides document review capabilities with MCP tools for external verification.
"""

from agent import process_review
from lambda_handler import handler
from utils import (
    ensure_result_fields,
    format_prompt,
    get_language_name,
    parse_json_result,
)

__all__ = [
    "process_review",
    "handler",
    "get_language_name",
    "format_prompt",
    "parse_json_result",
    "ensure_result_fields",
]
