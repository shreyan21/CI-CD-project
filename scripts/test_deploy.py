#!/usr/bin/env python3
"""Exercise deployment control flow offline; never contact AWS or Docker."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('deploy.sh')
COMMAND_ID = '12345678-1234-1234-1234-123456789abc'
MOCK_AWS = '''#!/usr/bin/env python3
import json, os, sys
args = sys.argv[1:]
with open(os.environ['MOCK_CALLS'], 'a') as f:
    f.write(json.dumps(args) + '\\n')
assert args[0] == 'ssm', args
assert args[args.index('--region') + 1] == 'ap-south-1', args
operation = args[1]
if operation == 'send-command':
    assert args[args.index('--query') + 1] == 'Command.CommandId', args
    assert args[args.index('--output') + 1] == 'text', args
    parameters = json.loads(args[args.index('--parameters') + 1])
    assert parameters['commands'][-1].endswith('npm run db:migrate'), parameters
    code = int(os.environ.get('MOCK_SEND_STATUS', '0'))
    if code:
        print('InvalidInstanceId: Instances not in a valid state for account', file=sys.stderr)
        sys.exit(code)
    print(os.environ.get('MOCK_COMMAND_ID', '12345678-1234-1234-1234-123456789abc'))
elif operation == 'wait':
    assert args[2] == 'command-executed', args
    assert args[args.index('--command-id') + 1] == '12345678-1234-1234-1234-123456789abc', args
    sys.exit(int(os.environ.get('MOCK_WAIT_STATUS', '0')))
elif operation == 'get-command-invocation':
    assert args[args.index('--command-id') + 1] == '12345678-1234-1234-1234-123456789abc', args
    print(json.dumps({'Status': 'Failed' if os.environ.get('MOCK_WAIT_STATUS') else 'Success', 'Output': 'REMOTE_RESULT'}))
    sys.exit(int(os.environ.get('MOCK_RESULT_STATUS', '0')))
else:
    raise AssertionError('Unexpected AWS operation: ' + repr(args))
'''


class DeployControlFlow(unittest.TestCase):
    def run_deploy(self, overrides=None, missing=None):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            executable = root / 'aws'
            executable.write_text(MOCK_AWS)
            executable.chmod(0o700)
            calls_file = root / 'calls.jsonl'
            env = {**os.environ,
                   'PATH': str(root) + os.pathsep + os.environ['PATH'],
                   'AWS_INSTANCE_ID': 'i-0123456789abcdef0',
                   'AWS_REGION': 'ap-south-1',
                   'ECR_REGISTRY': '123456789012.dkr.ecr.ap-south-1.amazonaws.com',
                   'MOCK_CALLS': str(calls_file),
                   **(overrides or {})}
            if missing:
                env.pop(missing, None)
            result = subprocess.run(['bash', str(SCRIPT)], env=env, text=True, capture_output=True)
            calls = [json.loads(line) for line in calls_file.read_text().splitlines()] if calls_file.exists() else []
            return result, calls

    def test_success_waits_and_retrieves_remote_result(self):
        result, calls = self.run_deploy()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([call[1] for call in calls], ['send-command', 'wait', 'get-command-invocation'])
        self.assertIn('REMOTE_RESULT', result.stdout)

    def test_invalid_target_stops_before_waiting(self):
        result, calls = self.run_deploy({'MOCK_SEND_STATUS': '254'})
        self.assertEqual(result.returncode, 254)
        self.assertEqual(len(calls), 1)
        self.assertIn('Check the target instance', result.stderr)

    def test_wait_failure_keeps_failure_and_prints_diagnostics(self):
        result, calls = self.run_deploy({'MOCK_WAIT_STATUS': '255'})
        self.assertEqual(result.returncode, 255)
        self.assertEqual(calls[-1][1], 'get-command-invocation')
        self.assertIn('REMOTE_RESULT', result.stdout)

    def test_wait_failure_is_preserved_when_diagnostics_also_fail(self):
        result, _ = self.run_deploy({'MOCK_WAIT_STATUS': '255', 'MOCK_RESULT_STATUS': '5'})
        self.assertEqual(result.returncode, 255)

    def test_result_lookup_failure_cannot_report_success(self):
        result, _ = self.run_deploy({'MOCK_RESULT_STATUS': '5'})
        self.assertEqual(result.returncode, 5)
        self.assertNotIn('SSM confirmed', result.stdout)

    def test_json_response_cannot_be_used_as_command_id(self):
        result, calls = self.run_deploy({'MOCK_COMMAND_ID': json.dumps({'Command': {'CommandId': COMMAND_ID}})})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(len(calls), 1)
        self.assertIn('valid command ID', result.stderr)

    def test_missing_instance_stops_without_contacting_aws(self):
        result, calls = self.run_deploy(missing='AWS_INSTANCE_ID')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(calls, [])


if __name__ == '__main__':
    unittest.main(verbosity=2)
