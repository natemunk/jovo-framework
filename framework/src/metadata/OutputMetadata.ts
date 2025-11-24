import { BaseOutput, OutputConstructor } from '../BaseOutput';
import { ClassDecoratorMetadata } from './ClassDecoratorMetadata';

export class OutputMetadata<OUTPUT extends BaseOutput = BaseOutput> extends ClassDecoratorMetadata {
  constructor(
    // eslint-disable-next-line @typescript-eslint/ban-types
    readonly target: OutputConstructor<OUTPUT> | Function,
    readonly name: string,
  ) {
    super(target);
  }
}
