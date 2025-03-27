State Machine Fragments
It is possible to define reusable (or abstracted) mini-state machines by defining a construct that implements IChainable, which requires you to define two fields:

startState: State, representing the entry point into this state machine.
endStates: INextable[], representing the (one or more) states that outgoing transitions will be added to if you chain onto the fragment.
Since states will be named after their construct IDs, you may need to prefix the IDs of states if you plan to instantiate the same state machine fragment multiples times (otherwise all states in every instantiation would have the same name).

The class StateMachineFragment contains some helper functions (like prefixStates()) to make it easier for you to do this. If you define your state machine as a subclass of this, it will be convenient to use:

import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import \* as sfn from 'aws-cdk-lib/aws-stepfunctions';

interface MyJobProps {
jobFlavor: string;
}

class MyJob extends sfn.StateMachineFragment {
public readonly startState: sfn.State;
public readonly endStates: sfn.INextable[];

constructor(parent: Construct, id: string, props: MyJobProps) {
super(parent, id);

    const choice = new sfn.Choice(this, 'Choice')
      .when(sfn.Condition.stringEquals('$.branch', 'left'), new sfn.Pass(this, 'Left Branch'))
      .when(sfn.Condition.stringEquals('$.branch', 'right'), new sfn.Pass(this, 'Right Branch'));

    // ...

    this.startState = choice;
    this.endStates = choice.afterwards().endStates;

}
}

class MyStack extends Stack {
constructor(scope: Construct, id: string) {
super(scope, id);
// Do 3 different variants of MyJob in parallel
const parallel = new sfn.Parallel(this, 'All jobs')
.branch(new MyJob(this, 'Quick', { jobFlavor: 'quick' }).prefixStates())
.branch(new MyJob(this, 'Medium', { jobFlavor: 'medium' }).prefixStates())
.branch(new MyJob(this, 'Slow', { jobFlavor: 'slow' }).prefixStates());

    new sfn.StateMachine(this, 'MyStateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(parallel),
    });

}
}
Example not in your language?

A few utility functions are available to parse state machine fragments.

State.findReachableStates: Retrieve the list of states reachable from a given state.
State.findReachableEndStates: Retrieve the list of end or terminal states reachable from a given state.
