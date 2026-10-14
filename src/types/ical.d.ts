declare module 'ical.js' {
  const ICAL: {
    parse: (input: string) => any[];
    Component: new (jCal: any[] | string) => {
      name: string;
      getAllSubcomponents: (name?: string) => any[];
      addSubcomponent: (component: any) => any;
      getFirstPropertyValue: (name: string) => any;
      toString: () => string;
    };
    Event: new (component: any) => {
      summary: string;
      description?: string;
      location?: string;
      startDate: { toJSDate: () => Date; isDate: boolean };
      endDate: { toJSDate: () => Date; isDate: boolean };
      uid?: string;
      color?: string;
    };
    Time: {
      fromJSDate: (date: Date, isDate?: boolean) => any;
    };
    Property: new (name: string, value: any) => any;
  };
  export default ICAL;
}
