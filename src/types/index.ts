export * from './habit';
export * from './auth';

export interface NavigationProps {
  navigation: any;
  route: any;
}

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  HabitDetail: { habitId: string };
  CreateHabit: undefined;
  EditHabit: { habitId: string };
  Profile: undefined;
};

export type TabParamList = {
  Habits: undefined;
  Analytics: undefined;
  Profile: undefined;
};
