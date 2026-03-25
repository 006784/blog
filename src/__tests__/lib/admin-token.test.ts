import {
  decodeAdminToken,
  encodeAdminToken,
  isValidAdminBearer,
  readVerifyResponseToken,
} from '@/lib/admin-token';

describe('admin token helpers', () => {
  it('encodes and decodes unicode passwords safely', () => {
    const password = '日记本-Admin@2026';
    const token = encodeAdminToken(password);

    expect(token).toBeTruthy();
    expect(decodeAdminToken(token)).toBe(password);
  });

  it('reads the token from the nested API success payload', () => {
    expect(
      readVerifyResponseToken({
        success: true,
        data: { token: 'nested-token' },
      })
    ).toBe('nested-token');
  });

  it('still accepts the legacy flat token payload shape', () => {
    expect(readVerifyResponseToken({ success: true, token: 'flat-token' })).toBe(
      'flat-token'
    );
  });

  it('validates bearer tokens against the admin password', () => {
    const password = 'secret-管理员';
    const token = encodeAdminToken(password);

    expect(isValidAdminBearer(`Bearer ${token}`, password)).toBe(true);
    expect(isValidAdminBearer('Bearer wrong-token', password)).toBe(false);
    expect(isValidAdminBearer(null, password)).toBe(false);
  });
});
