#!/usr/bin/env python3
"""
Logging utility for the AI Agent system.
Provides structured logging to files with rotation and formatting.
"""
import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Get project root directory (parent of src/)
PROJECT_ROOT = Path(__file__).parent.parent
DEFAULT_LOG_DIR = PROJECT_ROOT / "logs"


def setup_logger(
    name: str,
    log_dir: str = None,
    level: int = logging.INFO,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> logging.Logger:
    """
    Setup a logger with file and console handlers.
    
    Args:
        name: Logger name (e.g., 'ai_agent', 'tools', 'database')
        log_dir: Directory to store log files (default: project_root/logs)
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        max_bytes: Maximum size of each log file before rotation
        backup_count: Number of backup files to keep
    
    Returns:
        Configured logger instance
    """
    # Use default log directory if not specified
    if log_dir is None:
        log_dir = DEFAULT_LOG_DIR
    
    # Create logs directory if it doesn't exist
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S'
    )
    
    # File handler with rotation
    log_file = os.path.join(log_dir, f"{name}.log")
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=max_bytes,
        backupCount=backup_count
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(detailed_formatter)
    
    # Console handler (less verbose)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(simple_formatter)
    
    # Add handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get an existing logger or create a new one.
    
    Args:
        name: Logger name
    
    Returns:
        Logger instance
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        return setup_logger(name)
    return logger


class ConversationLogger:
    """
    Special logger for conversation tracking.
    Logs conversations in a structured format for easy analysis.
    """
    
    def __init__(self, log_dir: str = None):
        # Use default log directory if not specified
        if log_dir is None:
            log_dir = DEFAULT_LOG_DIR
        
        self.log_dir = log_dir
        Path(log_dir).mkdir(parents=True, exist_ok=True)
        self.logger = setup_logger('conversations', log_dir)
    
    def log_query(self, user_email: str, query: str, masked_email: str = None):
        """Log user query"""
        email = masked_email or self._mask_email(user_email)
        self.logger.info(f"QUERY | {email} | {query}")
    
    def log_response(self, user_email: str, response: str, masked_email: str = None):
        """Log AI response"""
        email = masked_email or self._mask_email(user_email)
        # Truncate long responses for logging
        response_preview = response[:200] + "..." if len(response) > 200 else response
        self.logger.info(f"RESPONSE | {email} | {response_preview}")
    
    def log_tool_use(self, user_email: str, tool_name: str, result: str, masked_email: str = None):
        """Log tool usage"""
        email = masked_email or self._mask_email(user_email)
        self.logger.info(f"TOOL | {email} | {tool_name} | {result}")
    
    def log_error(self, user_email: str, error: str, masked_email: str = None):
        """Log error"""
        email = masked_email or self._mask_email(user_email)
        self.logger.error(f"ERROR | {email} | {error}")
    
    @staticmethod
    def _mask_email(email: str) -> str:
        """Mask email for privacy"""
        if '@' not in email:
            return email
        local, domain = email.split('@')
        if len(local) <= 2:
            masked_local = local[0] + '*'
        else:
            masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
        return f"{masked_local}@{domain}"


def log_system_event(event: str, details: str = ""):
    """
    Log system-level events (startup, shutdown, errors, etc.)
    
    Args:
        event: Event name
        details: Additional details
    """
    logger = get_logger('system')
    logger.info(f"{event} | {details}")


# Example usage
if __name__ == "__main__":
    # Test the logger
    logger = setup_logger('test')
    
    logger.debug("This is a debug message")
    logger.info("This is an info message")
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    logger.critical("This is a critical message")
    
    # Test conversation logger
    conv_logger = ConversationLogger()
    conv_logger.log_query("user@example.com", "What's my balance?")
    conv_logger.log_response("user@example.com", "Your balance is MYR 1,500")
    conv_logger.log_tool_use("user@example.com", "calculate_balance", "Success")
    
    print("\n✅ Logs created in logs/ directory")
    print("Check logs/test.log and logs/conversations.log")
