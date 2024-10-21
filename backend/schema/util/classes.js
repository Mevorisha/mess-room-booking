export function enforceInterfaceStaticMembers(className, interfaceName) {
  const classStatics = Object.getOwnPropertyNames(className);
  const interfaceStatics = Object.getOwnPropertyNames(interfaceName);

  interfaceStatics.forEach((prop) => {
    if (!classStatics.includes(prop)) {
      throw new Error(
        `${className.name} must implement static member: ${interfaceName.name}.${prop}`
      );
    }

    const interfaceType = typeof interfaceName[prop];
    const classType = typeof className[prop];

    if (classType !== interfaceType) {
      throw new Error(
        `${className.name}'s static member '${prop}' must have the same type as in the interface (expected ${interfaceType}, found ${classType}).`
      );
    }
  });
}
