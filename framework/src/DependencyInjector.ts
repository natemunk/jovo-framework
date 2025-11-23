import { MetadataStorage } from './metadata/MetadataStorage';
import { Jovo } from './Jovo';
import { AnyObject, ArrayElement, Constructor } from '@jovotech/common';
import { InjectionToken, Provider } from './metadata/InjectableMetadata';
import { CircularDependencyError } from './errors/CircularDependencyError';
import { UnresolvableDependencyError } from './errors/UnresolvableDependencyError';
import { InvalidDependencyError } from './errors/InvalidDependencyError';

const INSTANTIATE_DEPENDENCY_MIDDLEWARE = 'event.DependencyInjector.instantiateDependency';

export interface DependencyTree<Node> {
  token: InjectionToken;
  resolvedValue: Node;
  children: DependencyTree<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Node extends Constructor<any, infer Args> ? ArrayElement<Args> : unknown
  >[];
}

export class DependencyInjector {
  private static resolveInjectionToken<TYPE extends AnyObject>(
    jovo: Jovo,
    token: InjectionToken,
    dependencyPath: InjectionToken[],
  ): DependencyTree<TYPE> | undefined {
    if (dependencyPath.includes(token)) {
      throw new CircularDependencyError(dependencyPath);
    }
    const providers = [...jovo.$app.providers, ...jovo.$app.systemProviders];

    const updatedPath = [...dependencyPath, token];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const injection = providers.find((injection) => {
      if (typeof injection === 'function') {
        return injection === token;
      } else {
        return injection.provide === token;
      }
    }) as Provider<TYPE> | undefined;
    if (!injection) {
      return undefined;
    }

    if (typeof injection === 'function') {
      return DependencyInjector.instantiateClassWithTracing(jovo, injection, updatedPath);
    } else if ('useValue' in injection) {
      return {
        token,
        resolvedValue: injection.useValue,
        children: [],
      };
    } else if ('useFactory' in injection) {
      const value = injection.useFactory(jovo);
      return {
        token,
        resolvedValue: value,
        children: [],
      };
    } else if ('useClass' in injection) {
      const tree = DependencyInjector.instantiateClassWithTracing(
        jovo,
        injection.useClass,
        updatedPath,
      );
      // insert proper token
      return {
        ...tree,
        token,
      };
    } else if ('useExisting' in injection) {
      const tree = DependencyInjector.resolveInjectionToken(
        jovo,
        injection.useExisting,
        updatedPath,
      );
      return {
        token,
        resolvedValue: tree?.resolvedValue as TYPE,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: (tree?.children ?? []) as any,
      };
    } else {
      return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instantiateClassWithTracing<TYPE extends AnyObject = any, ARGS extends unknown[] = []>(
    jovo: Jovo,
    clazz: Constructor<TYPE>,
    dependencyPath: InjectionToken[],
    ...predefinedArgs: ARGS
  ): DependencyTree<TYPE> {
    const injectedArgs = [...predefinedArgs];
    const storage = MetadataStorage.getInstance();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const injectMetadata = storage.getMergedInjectMetadata(clazz as Constructor<any>);
    const argTypes = Reflect.getMetadata('design:paramtypes', clazz) ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: DependencyTree<any>[] = [];
    for (
      let argumentIndex = predefinedArgs.length;
      argumentIndex < argTypes.length;
      argumentIndex++
    ) {
      const injectMetadataForArg = injectMetadata.find(
        (metadata) => metadata.index === argumentIndex,
      );
      let injectionToken: InjectionToken;
      if (injectMetadataForArg?.token) {
        injectionToken = injectMetadataForArg.token;
      } else {
        injectionToken = argTypes[argumentIndex];
      }
      if (!injectionToken) {
        // the argType will usually never be undefined. Even for interfaces or unknown, it will be the Object type.
        // Only when there is a circular import, the argType will be undefined.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new InvalidDependencyError(clazz as Constructor<any>, argumentIndex);
      }
      const childNode = DependencyInjector.resolveInjectionToken(
        jovo,
        injectionToken,
        dependencyPath,
      );
      if (!childNode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new UnresolvableDependencyError(clazz as Constructor<any>, injectionToken, argumentIndex);
      }
      injectedArgs.push(childNode.resolvedValue);
      children.push(childNode);
    }

    const instance = new clazz(...injectedArgs);
    return {
      token: clazz,
      resolvedValue: instance,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: children as any,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async instantiateClass<TYPE extends AnyObject = any, ARGS extends unknown[] = []>(
    jovo: Jovo,
    clazz: Constructor<TYPE>,
    ...predefinedArgs: ARGS
  ): Promise<TYPE> {
    const tree = this.instantiateClassWithTracing(jovo, clazz, [], ...predefinedArgs);
    await jovo.$handleRequest.middlewareCollection.run(
      INSTANTIATE_DEPENDENCY_MIDDLEWARE,
      jovo,
      tree,
    );
    return tree.resolvedValue as TYPE;
  }
}
