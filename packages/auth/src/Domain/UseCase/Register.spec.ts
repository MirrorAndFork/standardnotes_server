import 'reflect-metadata'
import { TimerInterface } from '@standardnotes/time'

import { CrypterInterface } from '../Encryption/CrypterInterface'
import { Role } from '../Role/Role'
import { RoleRepositoryInterface } from '../Role/RoleRepositoryInterface'
import { User } from '../User/User'

import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { Register } from './Register'
import { SettingServiceInterface } from '../Setting/SettingServiceInterface'
import { AuthResponseFactory20200115 } from '../Auth/AuthResponseFactory20200115'
import { Session } from '../Session/Session'
import { RoleName } from '@standardnotes/domain-core'

describe('Register', () => {
  let userRepository: UserRepositoryInterface
  let roleRepository: RoleRepositoryInterface
  let authResponseFactory: AuthResponseFactory20200115
  let settingService: SettingServiceInterface
  let user: User
  let crypter: CrypterInterface
  let timer: TimerInterface
  let transitionModeEnabled = false

  const createUseCase = () =>
    new Register(
      userRepository,
      roleRepository,
      authResponseFactory,
      crypter,
      false,
      settingService,
      timer,
      transitionModeEnabled,
    )

  beforeEach(() => {
    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.save = jest.fn()
    userRepository.findOneByUsernameOrEmail = jest.fn().mockReturnValue(null)

    roleRepository = {} as jest.Mocked<RoleRepositoryInterface>
    roleRepository.findOneByName = jest.fn().mockReturnValue(null)

    authResponseFactory = {} as jest.Mocked<AuthResponseFactory20200115>
    authResponseFactory.createResponse = jest
      .fn()
      .mockReturnValue({ response: { foo: 'bar' }, session: {} as jest.Mocked<Session> })

    crypter = {} as jest.Mocked<CrypterInterface>
    crypter.generateEncryptedUserServerKey = jest.fn().mockReturnValue('test')

    user = {} as jest.Mocked<User>

    settingService = {} as jest.Mocked<SettingServiceInterface>
    settingService.applyDefaultSettingsUponRegistration = jest.fn()

    timer = {} as jest.Mocked<TimerInterface>
    timer.getUTCDate = jest.fn().mockReturnValue(new Date(1))
  })

  it('should register a new user', async () => {
    expect(
      await createUseCase().execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20200115',
        ephemeralSession: false,
        version: '004',
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({ success: true, authResponse: { foo: 'bar' } })

    expect(userRepository.save).toHaveBeenCalledWith({
      email: 'test@test.te',
      encryptedPassword: expect.any(String),
      encryptedServerKey: 'test',
      serverEncryptionVersion: 1,
      pwCost: 11,
      pwNonce: undefined,
      pwSalt: 'qweqwe',
      updatedWithUserAgent: 'Mozilla',
      uuid: expect.any(String),
      version: '004',
      roles: Promise.resolve([]),
      createdAt: new Date(1),
      updatedAt: new Date(1),
    })

    expect(settingService.applyDefaultSettingsUponRegistration).toHaveBeenCalled()
  })

  it('should register a new user with default role', async () => {
    const role = new Role()
    role.name = 'role1'
    roleRepository.findOneByName = jest.fn().mockReturnValue(role)

    expect(
      await createUseCase().execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20200115',
        ephemeralSession: false,
        version: '004',
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({ success: true, authResponse: { foo: 'bar' } })

    expect(userRepository.save).toHaveBeenCalledWith({
      email: 'test@test.te',
      encryptedPassword: expect.any(String),
      encryptedServerKey: 'test',
      serverEncryptionVersion: 1,
      pwCost: 11,
      pwNonce: undefined,
      pwSalt: 'qweqwe',
      updatedWithUserAgent: 'Mozilla',
      uuid: expect.any(String),
      version: '004',
      createdAt: new Date(1),
      updatedAt: new Date(1),
      roles: Promise.resolve([role]),
    })
  })

  it('should register a new user with default role and transition role', async () => {
    transitionModeEnabled = true

    const role = new Role()
    role.name = RoleName.NAMES.CoreUser

    const transitionRole = new Role()
    transitionRole.name = RoleName.NAMES.TransitionUser

    roleRepository.findOneByName = jest.fn().mockReturnValueOnce(role).mockReturnValueOnce(transitionRole)

    expect(
      await createUseCase().execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20200115',
        ephemeralSession: false,
        version: '004',
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({ success: true, authResponse: { foo: 'bar' } })

    expect(userRepository.save).toHaveBeenCalledWith({
      email: 'test@test.te',
      encryptedPassword: expect.any(String),
      encryptedServerKey: 'test',
      serverEncryptionVersion: 1,
      pwCost: 11,
      pwNonce: undefined,
      pwSalt: 'qweqwe',
      updatedWithUserAgent: 'Mozilla',
      uuid: expect.any(String),
      version: '004',
      createdAt: new Date(1),
      updatedAt: new Date(1),
      roles: Promise.resolve([role, transitionRole]),
    })
  })

  it('should fail to register if username is invalid', async () => {
    expect(
      await createUseCase().execute({
        email: '      ',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20200115',
        ephemeralSession: false,
        version: '004',
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({
      success: false,
      errorMessage: 'Username cannot be empty',
    })

    expect(userRepository.save).not.toHaveBeenCalled()
  })

  it('should fail to register if a user already exists', async () => {
    userRepository.findOneByUsernameOrEmail = jest.fn().mockReturnValue(user)

    expect(
      await createUseCase().execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20200115',
        ephemeralSession: false,
        version: '004',
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({
      success: false,
      errorMessage: 'This email is already registered.',
    })

    expect(userRepository.save).not.toHaveBeenCalled()
  })

  it('should fail to register for legacy api versions', async () => {
    expect(
      await createUseCase().execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20190520',
        ephemeralSession: false,
        version: '004',
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({
      success: false,
      errorMessage: 'Unsupported api version: 20190520',
    })

    expect(userRepository.save).not.toHaveBeenCalled()
  })

  it('should fail to register if a registration is disabled', async () => {
    userRepository.findOneByUsernameOrEmail = jest.fn().mockReturnValue(user)

    expect(
      await new Register(
        userRepository,
        roleRepository,
        authResponseFactory,
        crypter,
        true,
        settingService,
        timer,
        transitionModeEnabled,
      ).execute({
        email: 'test@test.te',
        password: 'asdzxc',
        updatedWithUserAgent: 'Mozilla',
        apiVersion: '20200115',
        version: '004',
        ephemeralSession: false,
        pwCost: 11,
        pwSalt: 'qweqwe',
        pwNonce: undefined,
      }),
    ).toEqual({
      success: false,
      errorMessage: 'User registration is currently not allowed.',
    })

    expect(userRepository.save).not.toHaveBeenCalled()
  })
})
