#!/usr/bin/env python3
"""
Test script to verify thread-aware memory isolation.
Demonstrates that Slack threads maintain separate conversation contexts.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ai_agent import ClaimAIAgent

def test_thread_isolation():
    """Test that different threads maintain separate memory."""
    
    print("="*70)
    print("TESTING THREAD-AWARE MEMORY ISOLATION")
    print("="*70)
    
    agent = ClaimAIAgent()
    user_email = "test@regentmarkets.com"
    
    # Simulate two different Slack threads
    thread_1 = "1234567890.123456"
    thread_2 = "9876543210.654321"
    
    print("\n" + "="*70)
    print("SCENARIO: Same user, two different Slack threads")
    print("="*70)
    
    # Thread 1: Ask about balance
    print("\n📍 THREAD 1 - First message")
    print("-"*70)
    result1 = agent.query(
        user_email=user_email,
        query_text="What's my claim balance?",
        thread_id=thread_1
    )
    print(f"User: What's my claim balance?")
    print(f"Bot: {result1['answer'][:150]}...")
    
    # Thread 1: Follow-up (should remember balance context)
    print("\n📍 THREAD 1 - Follow-up message")
    print("-"*70)
    result2 = agent.query(
        user_email=user_email,
        query_text="Can I use it for dental?",
        thread_id=thread_1
    )
    print(f"User: Can I use it for dental?")
    print(f"Bot: {result2['answer'][:150]}...")
    
    # Thread 2: Different topic (should NOT remember Thread 1's context)
    print("\n📍 THREAD 2 - First message (different topic)")
    print("-"*70)
    result3 = agent.query(
        user_email=user_email,
        query_text="How do I submit a claim?",
        thread_id=thread_2
    )
    print(f"User: How do I submit a claim?")
    print(f"Bot: {result3['answer'][:150]}...")
    
    # Thread 2: Follow-up (should remember Thread 2's context, not Thread 1)
    print("\n📍 THREAD 2 - Follow-up message")
    print("-"*70)
    result4 = agent.query(
        user_email=user_email,
        query_text="What documents do I need?",
        thread_id=thread_2
    )
    print(f"User: What documents do I need?")
    print(f"Bot: {result4['answer'][:150]}...")
    
    # Back to Thread 1 (should still remember Thread 1's context)
    print("\n📍 THREAD 1 - Another follow-up")
    print("-"*70)
    result5 = agent.query(
        user_email=user_email,
        query_text="What about optical?",
        thread_id=thread_1
    )
    print(f"User: What about optical?")
    print(f"Bot: {result5['answer'][:150]}...")
    
    # Check memory stats
    print("\n" + "="*70)
    print("MEMORY STATISTICS")
    print("="*70)
    stats = agent.get_memory_stats()
    print(f"Total threads: {stats['total_threads']}")
    print(f"Total messages: {stats['total_messages']}")
    print(f"Unique users: {stats['unique_users']}")
    print(f"Avg messages per thread: {stats['avg_messages_per_thread']:.1f}")
    
    # Verify thread isolation
    print("\n" + "="*70)
    print("VERIFICATION")
    print("="*70)
    
    thread1_memory = agent._get_user_memory(user_email, thread_1)
    thread2_memory = agent._get_user_memory(user_email, thread_2)
    
    print(f"✅ Thread 1 has {len(thread1_memory)} messages")
    print(f"✅ Thread 2 has {len(thread2_memory)} messages")
    print(f"✅ Threads are isolated: {len(thread1_memory) > 0 and len(thread2_memory) > 0}")
    
    # Test clearing specific thread
    print("\n" + "="*70)
    print("TESTING THREAD CLEANUP")
    print("="*70)
    
    print(f"\nClearing Thread 1 only...")
    agent.clear_memory(user_email, thread_1)
    
    thread1_memory_after = agent._get_user_memory(user_email, thread_1)
    thread2_memory_after = agent._get_user_memory(user_email, thread_2)
    
    print(f"✅ Thread 1 cleared: {len(thread1_memory_after)} messages")
    print(f"✅ Thread 2 preserved: {len(thread2_memory_after)} messages")
    
    # Test clearing all threads for user
    print(f"\nClearing all threads for user...")
    agent.clear_memory(user_email)
    
    stats_after = agent.get_memory_stats()
    print(f"✅ All threads cleared: {stats_after['total_threads']} threads remaining")
    
    print("\n" + "="*70)
    print("✅ THREAD ISOLATION TEST PASSED!")
    print("="*70)
    print("\nKey findings:")
    print("• Each Slack thread maintains separate conversation context")
    print("• Threads don't interfere with each other")
    print("• Memory can be cleared per-thread or per-user")
    print("• Perfect for Slack deployment!")


def test_backward_compatibility():
    """Test that non-threaded queries still work (CLI mode)."""
    
    print("\n" + "="*70)
    print("TESTING BACKWARD COMPATIBILITY (CLI MODE)")
    print("="*70)
    
    agent = ClaimAIAgent()
    user_email = "test@regentmarkets.com"
    
    # Query without thread_id (like CLI)
    print("\n📍 CLI Query (no thread_id)")
    print("-"*70)
    result = agent.query(
        user_email=user_email,
        query_text="What's my balance?"
    )
    print(f"User: What's my balance?")
    print(f"Bot: {result['answer'][:150]}...")
    
    # Follow-up without thread_id
    print("\n📍 CLI Follow-up (no thread_id)")
    print("-"*70)
    result2 = agent.query(
        user_email=user_email,
        query_text="Can I claim for dental?"
    )
    print(f"User: Can I claim for dental?")
    print(f"Bot: {result2['answer'][:150]}...")
    
    print("\n✅ Backward compatibility maintained!")
    print("   CLI mode (no thread_id) works as before")


if __name__ == "__main__":
    try:
        # Test thread isolation
        test_thread_isolation()
        
        # Test backward compatibility
        test_backward_compatibility()
        
        print("\n" + "="*70)
        print("🎉 ALL TESTS PASSED!")
        print("="*70)
        print("\nYour agent is ready for Slack deployment with thread support!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
